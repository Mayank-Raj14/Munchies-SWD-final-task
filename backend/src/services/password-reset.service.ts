import crypto from 'node:crypto';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import { buildEmailHtml, sendEmail } from './email.service.js';

const CODE_EXPIRY_MINUTES = 15;

const generateCode = () =>
  crypto.randomInt(100_000, 999_999).toString();

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
    select: { id: true, email: true, name: true },
  });

  // Don't reveal whether user exists
  if (!user) return;

  // Invalidate previous tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, code, expiresAt },
  });

  await sendEmail({
    to: user.email,
    subject: 'Your Munchies password reset code',
    text: `Your password reset code is: ${code}\n\nIt expires in ${CODE_EXPIRY_MINUTES} minutes. If you didn't request this, ignore this email.`,
    html: buildEmailHtml('Reset your Munchies password', [
      `Hi ${user.name},`,
      `Your password reset code is:`,
      `<strong style="font-size:2rem;letter-spacing:0.2em;color:#f97316">${code}</strong>`,
      `This code expires in <strong>${CODE_EXPIRY_MINUTES} minutes</strong>.`,
      `If you didn't request this, you can safely ignore this email.`,
    ]),
  });
};

export const verifyResetCode = async (email: string, code: string) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
    select: { id: true },
  });

  if (!user) throw new AppError('Invalid or expired code', 400);

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) throw new AppError('Invalid or expired code', 400);

  return { valid: true };
};

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
    select: { id: true },
  });

  if (!user) throw new AppError('Invalid or expired code', 400);

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) throw new AppError('Invalid or expired code', 400);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    }),
  ]);
};