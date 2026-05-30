import { Role } from '@prisma/client';
import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  approveStoreOwnershipRequest,
  createStoreOwnershipRequest,
  listPendingStoreOwnershipRequests,
  listUserStoreOwnershipRequests,
  rejectStoreOwnershipRequest,
} from '../services/store-ownership-request.service.js';

export const createRequest = async (req: AuthenticatedRequest, res: Response) => {
  const request = await createStoreOwnershipRequest({
    userId: req.user?.id ?? '',
    hostelId: req.body.hostelId,
    storeName: req.body.storeName,
    roomNumber: req.body.roomNumber,
  });

  res.status(201).json({ request });
};

export const listPendingRequests = async (_req: AuthenticatedRequest, res: Response) => {
  const requests = await listPendingStoreOwnershipRequests();

  res.status(200).json({ requests });
};

export const listMyRequests = async (req: AuthenticatedRequest, res: Response) => {
  const requests = await listUserStoreOwnershipRequests(req.user?.id ?? '');

  res.status(200).json({ requests });
};

export const approveRequest = async (req: AuthenticatedRequest, res: Response) => {
  const request = await approveStoreOwnershipRequest(req.params.id ?? '', req.user?.id ?? '');

  res.status(200).json({ request });
};

export const rejectRequest = async (req: AuthenticatedRequest, res: Response) => {
  const request = await rejectStoreOwnershipRequest(req.params.id ?? '', req.user?.id ?? '');

  res.status(200).json({ request });
};

export const adminRole = Role.ADMIN;