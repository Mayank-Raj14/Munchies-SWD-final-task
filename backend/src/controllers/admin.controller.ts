import type { Response } from 'express';
import { Role } from '@prisma/client';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  searchUsersForAdmin,
  listStoresForAdmin,
} from '../services/admin.service';

export const adminUserSearch = async (req: AuthenticatedRequest, res: Response) => {
  const query = String(req.query.query ?? '').trim();
  const result = await searchUsersForAdmin(query);
  res.status(200).json(result);
};


export const adminListStores = async (_req: AuthenticatedRequest, res: Response) => {
  const result = await listStoresForAdmin();
  res.status(200).json(result);
};

export const adminEnsure = async (req: AuthenticatedRequest) => {
  if (req.user?.role !== Role.ADMIN) {
    // Redundant: route-level requireRole should already guard.
    // Keeping this to be extra defensive for secure permission validation.
    throw new Error('Admin access required');
  }
};

