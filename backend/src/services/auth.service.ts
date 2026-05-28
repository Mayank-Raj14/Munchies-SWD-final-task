import { Role } from '@prisma/client';

import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { signAuthToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { syncApprovedStoreOwnershipForUser } from './store-ownership-sync.service.js';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type EmailPreferenceInput = {
  emailNotificationsEnabled: boolean;
  bookings?: boolean;
  promotions?: boolean;
  newStores?: boolean;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  warningCount: true,
  emailNotificationsEnabled: true,
  preferences: true,
  globalBlock: {
    select: {
      reason: true,
      createdAt: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getPlatformAdminEmail = () =>
  env.ADMIN_EMAIL?.trim().toLowerCase() ??
  env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ??
  null;

const syncPlatformAdminRole = async (
  userId: string,
  email: string,
  role: Role
): Promise<Role> => {
  const platformAdminEmail = getPlatformAdminEmail();

  if (!platformAdminEmail) {
    return role;
  }

  const normalizedUserEmail = normalizeEmail(email);
  const isPlatformAdmin = normalizedUserEmail === platformAdminEmail;

  // If user is not platform admin OR already admin, no update needed
  if (!isPlatformAdmin || role === Role.ADMIN) {
    return role;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: Role.ADMIN },
    select: { role: true },
  });

  return updated.role;
};

export const bootstrapPlatformAdminRole = async () => {
  const platformAdminEmail = getPlatformAdminEmail();

  if (!platformAdminEmail) {
    console.warn(
      'ADMIN_EMAIL / PLATFORM_ADMIN_EMAIL is not set. Platform admin auto-promotion is disabled.'
    );
    return;
  }

  const result = await prisma.user.updateMany({
    where: {
      email: { equals: platformAdminEmail, mode: 'insensitive' },
      role: { not: Role.ADMIN },
    },
    data: { role: Role.ADMIN },
  });

  if (result.count > 0) {
    console.log(
      `Promoted ${result.count} platform admin account(s) for ${platformAdminEmail}.`
    );
  }
};

export const registerUser = async (input: RegisterInput) => {
  const normalizedEmail = normalizeEmail(input.email);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: normalizedEmail,
      password: await hashPassword(input.password),
    },
    select: userSelect,
  });

  user.role = await syncPlatformAdminRole(
    user.id,
    user.email,
    user.role
  );

  const token = signAuthToken({
    userId: user.id,
    role: user.role,
  });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const normalizedEmail = normalizeEmail(input.email);

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    include: {
      globalBlock: {
        select: {
          reason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  await syncPlatformAdminRole(user.id, user.email, user.role);

  await syncApprovedStoreOwnershipForUser(user.id);

  const refreshedUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: userSelect,
  });

  const token = signAuthToken({
    userId: refreshedUser.id,
    role: refreshedUser.role,
  });

  return {
    user: {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      role: refreshedUser.role,
      warningCount: refreshedUser.warningCount,
      emailNotificationsEnabled:
        refreshedUser.emailNotificationsEnabled,
      preferences: refreshedUser.preferences,
      globalBlock: refreshedUser.globalBlock,
      createdAt: refreshedUser.createdAt,
      updatedAt: refreshedUser.updatedAt,
    },
    token,
  };
};

export const getUserById = async (userId: string) => {
  await syncApprovedStoreOwnershipForUser(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.role = await syncPlatformAdminRole(
    user.id,
    user.email,
    user.role
  );

  return user;
};

export const updateEmailPreferences = async (
  userId: string,
  input: EmailPreferenceInput
) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailNotificationsEnabled:
        input.emailNotificationsEnabled,
    },
  });

  if (
    input.bookings !== undefined ||
    input.promotions !== undefined ||
    input.newStores !== undefined
  ) {
    await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        bookings: input.bookings ?? true,
        promotions: input.promotions ?? true,
        newStores: input.newStores ?? true,
      },
      update: {
        ...(input.bookings !== undefined
          ? { bookings: input.bookings }
          : {}),
        ...(input.promotions !== undefined
          ? { promotions: input.promotions }
          : {}),
        ...(input.newStores !== undefined
          ? { newStores: input.newStores }
          : {}),
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: userSelect,
  });

  return user;
};

export type AuthenticatedUser = {
  id: string;
  role: Role;
};