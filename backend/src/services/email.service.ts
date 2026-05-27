import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';

type PreferenceTopic = 'bookings' | 'promotions' | 'newStores';

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
};

type UserEmailInput = Omit<EmailInput, 'to'> & {
  topic?: PreferenceTopic;
};

let transporter: Mail | null = null;
const sentKeys = new Set<string>();

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });

export const buildEmailHtml = (title: string, lines: string[]) => `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#17202a">
    <h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>
    ${lines.map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`).join('')}
  </div>
`;

const getTransporter = () => {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

const formatFrom = (fromName?: string) => {
  const address = env.EMAIL_USER ?? env.EMAIL_FROM;
  return fromName ? `"${fromName.replace(/"/g, '')}" <${address}>` : env.EMAIL_FROM;
};

const shouldSkipDuplicate = (input: EmailInput) => {
  const key = `${input.to}|${input.subject}|${input.text}`;
  if (sentKeys.has(key)) {
    return true;
  }

  sentKeys.add(key);
  if (sentKeys.size > 1000) {
    sentKeys.clear();
  }

  return false;
};

export const sendEmail = async (input: EmailInput) => {
  if (shouldSkipDuplicate(input)) {
    return { skipped: true };
  }

  const mailer = getTransporter();
  if (!mailer) {
    return { skipped: true };
  }

  try {
    await mailer.sendMail({
      from: formatFrom(input.fromName),
      replyTo: input.replyTo,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? buildEmailHtml(input.subject, [input.text]),
    });
    return { skipped: false };
  } catch (error) {
    console.error('Email send failed', {
      to: input.to,
      subject: input.subject,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { skipped: true };
  }
};

export const sendUserEmail = async (userId: string, input: UserEmailInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailNotificationsEnabled: true,
      preferences: true,
    },
  });

  const topicAllowed =
    !input.topic || !user?.preferences || user.preferences[input.topic] !== false;

  if (!user?.emailNotificationsEnabled || !topicAllowed) {
    return { skipped: true };
  }

  return sendEmail({
    to: user.email,
    ...input,
  });
};

export const sendUsersEmail = async (userIds: string[], input: UserEmailInput) => {
  await Promise.allSettled([...new Set(userIds)].map((userId) => sendUserEmail(userId, input)));
};

export const getStoreSender = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      name: true,
      email: true,
      owner: { select: { email: true, name: true } },
    },
  });

  return {
    fromName: store?.name ?? 'Munchies',
    replyTo: store?.email ?? store?.owner.email,
  };
};
