import { Role, StoreOwnershipRequestStatus } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

type CreateStoreOwnershipRequestInput = {
  userId: string;
  hostelId: string;
  storeName: string;
  roomNumber: string;
};

const requestInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  hostel: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const createStoreOwnershipRequest = async (input: CreateStoreOwnershipRequestInput) => {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role !== Role.USER) {
    throw new AppError('Only regular users can request store ownership', 403);
  }

  const hostel = await prisma.hostel.findUnique({
    where: { id: input.hostelId },
    select: { id: true },
  });

  if (!hostel) {
    throw new AppError('Hostel not found', 404);
  }

  const pendingRequest = await prisma.storeOwnershipRequest.findFirst({
    where: {
      userId: input.userId,
      status: StoreOwnershipRequestStatus.PENDING,
    },
    select: { id: true },
  });

  if (pendingRequest) {
    throw new AppError('You already have a pending store ownership request', 409);
  }

  return prisma.storeOwnershipRequest.create({
    data: {
      userId: input.userId,
      hostelId: input.hostelId,
      storeName: input.storeName,
      roomNumber: input.roomNumber,
    },
    include: requestInclude,
  });
};

export const listPendingStoreOwnershipRequests = async () => {
  return prisma.storeOwnershipRequest.findMany({
    where: { status: StoreOwnershipRequestStatus.PENDING },
    include: requestInclude,
    orderBy: { createdAt: 'asc' },
  });
};

export const approveStoreOwnershipRequest = async (requestId: string, adminId: string) => {
  const request = await prisma.storeOwnershipRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!request) {
    throw new AppError('Store ownership request not found', 404);
  }

  if (request.status !== StoreOwnershipRequestStatus.PENDING) {
    throw new AppError('Store ownership request has already been reviewed', 409);
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: request.userId },
      data: { role: Role.STORE_OWNER },
    });

    return tx.storeOwnershipRequest.update({
      where: { id: requestId },
      data: {
        status: StoreOwnershipRequestStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
  });
};

export const rejectStoreOwnershipRequest = async (requestId: string, adminId: string) => {
  const request = await prisma.storeOwnershipRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!request) {
    throw new AppError('Store ownership request not found', 404);
  }

  if (request.status !== StoreOwnershipRequestStatus.PENDING) {
    throw new AppError('Store ownership request has already been reviewed', 409);
  }

  return prisma.storeOwnershipRequest.update({
    where: { id: requestId },
    data: {
      status: StoreOwnershipRequestStatus.REJECTED,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
    include: requestInclude,
  });
};
