import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  blockGlobalUser,
  blockStoreUser,
  getUserWarnings,
  unblockGlobalUser,
  unblockStoreUser,
  warnGlobalUser,
  warnStoreUser,
} from '../controllers/governance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  storeUserGovernanceActionSchema,
  storeUserGovernanceParamSchema,
  userGovernanceActionSchema,
  userGovernanceParamSchema,
} from '../validators/governance.validator.js';

export const governanceRouter = Router();
export const adminGovernanceRouter = Router();

governanceRouter.use(authenticate, requireRole(Role.STORE_OWNER, Role.ADMIN));
governanceRouter.post(
  '/stores/:storeId/users/:userId/warnings',
  validateRequest(storeUserGovernanceActionSchema),
  asyncHandler(warnStoreUser),
);
governanceRouter.post(
  '/stores/:storeId/users/:userId/block',
  validateRequest(storeUserGovernanceActionSchema),
  asyncHandler(blockStoreUser),
);
governanceRouter.delete(
  '/stores/:storeId/users/:userId/block',
  validateRequest(storeUserGovernanceParamSchema),
  asyncHandler(unblockStoreUser),
);

adminGovernanceRouter.use(authenticate, requireRole(Role.ADMIN));
adminGovernanceRouter.get(
  '/users/:userId/warnings',
  validateRequest(userGovernanceParamSchema),
  asyncHandler(getUserWarnings),
);
adminGovernanceRouter.post(
  '/users/:userId/warnings',
  validateRequest(userGovernanceActionSchema),
  asyncHandler(warnGlobalUser),
);
adminGovernanceRouter.post(
  '/users/:userId/block',
  validateRequest(userGovernanceActionSchema),
  asyncHandler(blockGlobalUser),
);
adminGovernanceRouter.delete(
  '/users/:userId/block',
  validateRequest(userGovernanceParamSchema),
  asyncHandler(unblockGlobalUser),
);
