import { Role, StoreOwnershipRequestStatus } from '@prisma/client';

import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { assertUserNotGloballyBlocked } from './governance.service.js';
import { invalidateStoreCaches } from './store.service.js';
import { sendUserEmail, sendUsersEmail } from './email.service.js';
import { syncApprovedRequestStore } from './store-ownership-sync.service.js';

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

  if (user.role === Role.ADMIN) {
    throw new AppError('Admins cannot submit store ownership requests', 403);
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
    throw new AppError('A pending request already exists for this store', 409);
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
  const approvedRequest = await prisma.$transaction(async (tx) => {
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

    const storeId = await syncApprovedRequestStore(tx, request);

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

    invalidateStoreCaches(request.userId, storeId);
    return approvedRequest;
  });

  void sendUserEmail(approvedRequest.user.id, {
    subject: 'Your Munchies store was approved',
    text: `${approvedRequest.storeName} is approved and now visible in Munchies.`,
    topic: 'newStores',
    fromName: 'Munchies',
  }).catch(() => undefined);

  const recipients = await prisma.user.findMany({
    where: { id: { not: approvedRequest.user.id }, emailNotificationsEnabled: true },
    select: { id: true },
  });
  void sendUsersEmail(
    recipients.map((user) => user.id),
    {
      subject: `New Munchies store: ${approvedRequest.storeName}`,
      text: `${approvedRequest.storeName} is now open in ${approvedRequest.hostel.name}.`,
      topic: 'newStores',
      fromName: 'Munchies',
    },
  ).catch(() => undefined);

  return approvedRequest;
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

  const rejectedRequest = await prisma.$transaction(async (tx) => {
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

  void sendUserEmail(rejectedRequest.user.id, {
    subject: 'Your Munchies store request was reviewed',
    text: `${rejectedRequest.storeName} was not approved. You can submit a corrected request from Munchies.`,
    topic: 'newStores',
    fromName: 'Munchies',
  }).catch(() => undefined);

  return rejectedRequest;
};
