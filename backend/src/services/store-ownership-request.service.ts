import { Role, StoreOwnershipRequestStatus } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { assertUserNotGloballyBlocked } from './governance.service.js';

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
  await assertUserNotGloballyBlocked(input.userId, 'request store ownership');

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

  const existingStore = await prisma.store.findUnique({
    where: {
      hostelId_roomNumber_name: {
        hostelId: input.hostelId,
        roomNumber: input.roomNumber,
        name: input.storeName,
      },
    },
    select: { id: true },
  });

  if (existingStore) {
    throw new AppError('A store already exists with these details', 409);
  }

  const pendingRequest = await prisma.storeOwnershipRequest.findFirst({
    where: {
      status: StoreOwnershipRequestStatus.PENDING,
      OR: [
        { userId: input.userId },
        {
          hostelId: input.hostelId,
          roomNumber: input.roomNumber,
          storeName: input.storeName,
        },
      ],
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

export const listUserStoreOwnershipRequests = async (userId: string) => {
  return prisma.storeOwnershipRequest.findMany({
    where: { userId },
    include: requestInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const approveStoreOwnershipRequest = async (requestId: string, adminId: string) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.storeOwnershipRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        hostelId: true,
        storeName: true,
        roomNumber: true,
        status: true,
      },
    });

    if (!request) {
      throw new AppError('Store ownership request not found', 404);
    }

    if (request.status !== StoreOwnershipRequestStatus.PENDING) {
      throw new AppError('Store ownership request has already been reviewed', 409);
    }

    const reviewedAt = new Date();
    const claimed = await tx.storeOwnershipRequest.updateMany({
      where: {
        id: requestId,
        status: StoreOwnershipRequestStatus.PENDING,
      },
      data: {
        status: StoreOwnershipRequestStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt,
      },
    });

    if (claimed.count !== 1) {
      throw new AppError('Store ownership request has already been reviewed', 409);
    }

    const storeKey = {
      hostelId: request.hostelId,
      roomNumber: request.roomNumber,
      name: request.storeName,
    };

    const existingStore = await tx.store.findUnique({
      where: { hostelId_roomNumber_name: storeKey },
      select: { ownerId: true },
    });

    if (existingStore && existingStore.ownerId !== request.userId) {
      throw new AppError('A store already exists at this hostel and room with another owner', 409);
    }

    await tx.user.update({
      where: { id: request.userId },
      data: { role: Role.STORE_OWNER },
    });

    if (!existingStore) {
      await tx.store.create({
        data: {
          ...storeKey,
          ownerId: request.userId,
        },
      });
    }

    const approvedRequest = await tx.storeOwnershipRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: requestInclude,
    });

    await tx.storeOwnershipRequest.updateMany({
      where: {
        id: { not: requestId },
        status: StoreOwnershipRequestStatus.PENDING,
        OR: [
          { userId: request.userId },
          {
            hostelId: request.hostelId,
            roomNumber: request.roomNumber,
            storeName: request.storeName,
          },
        ],
      },
      data: {
        status: StoreOwnershipRequestStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt,
      },
    });

    return approvedRequest;
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.storeOwnershipRequest.updateMany({
      where: {
        id: requestId,
        status: StoreOwnershipRequestStatus.PENDING,
      },
      data: {
        status: StoreOwnershipRequestStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new AppError('Store ownership request has already been reviewed', 409);
    }

    return tx.storeOwnershipRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: requestInclude,
    });
  });
};
