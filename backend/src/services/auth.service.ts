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

const getPlatformAdminEmail = () => env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ?? null;

const syncPlatformAdminRole = async (userId: string, email: string, role: Role) => {
  const platformAdminEmail = getPlatformAdminEmail();
  if (!platformAdminEmail) {
    return role;
  }

  const isPlatformAdmin = email.trim().toLowerCase() === platformAdminEmail;
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

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
    },
    select: userSelect,
  });

  user.role = await syncPlatformAdminRole(user.id, user.email, user.role);

  const token = signAuthToken({ userId: user.id, role: user.role });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
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

  const token = signAuthToken({ userId: refreshedUser.id, role: refreshedUser.role });

  return {
    user: {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      role: refreshedUser.role,
      warningCount: refreshedUser.warningCount,
      emailNotificationsEnabled: refreshedUser.emailNotificationsEnabled,
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

  user.role = await syncPlatformAdminRole(user.id, user.email, user.role);

  return user;
};

export const updateEmailPreferences = async (userId: string, input: EmailPreferenceInput) => {
  await prisma.user.update({
    where: { id: userId },
    data: { emailNotificationsEnabled: input.emailNotificationsEnabled },
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
        ...(input.bookings !== undefined ? { bookings: input.bookings } : {}),
        ...(input.promotions !== undefined ? { promotions: input.promotions } : {}),
        ...(input.newStores !== undefined ? { newStores: input.newStores } : {}),
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });

  return user;
};

export type AuthenticatedUser = {
  id: string;
  role: Role;
};
