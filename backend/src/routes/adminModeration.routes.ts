import { Router } from 'express';
import { Role } from '@prisma/client';

import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middleware/validate-request.js';
import { storeIdParamSchema } from '../validators/admin.validator.js';
import {
  adminBlockEveryoneFromStore,
  adminRemoveStore,
  adminReactivateStore,
  adminSuspendStore,
  adminUnblockEveryoneFromStore,
} from '../controllers/adminModeration.controller.js';

export const adminModerationRouter = Router();

adminModerationRouter.use(authenticate, requireRole(Role.ADMIN));

adminModerationRouter.post(
  '/stores/:storeId/block-everyone',
  validateRequest(storeIdParamSchema),
  asyncHandler(adminBlockEveryoneFromStore),
);

adminModerationRouter.delete(
  '/stores/:storeId/block-everyone',
  validateRequest(storeIdParamSchema),
  asyncHandler(adminUnblockEveryoneFromStore),
);

adminModerationRouter.delete(
  '/stores/:storeId',
  validateRequest(storeIdParamSchema),
  asyncHandler(adminRemoveStore),
);

adminModerationRouter.post(
  '/stores/:storeId/suspend',
  validateRequest(storeIdParamSchema),
  asyncHandler(adminSuspendStore),
);

adminModerationRouter.post(
  '/stores/:storeId/reactivate',
  validateRequest(storeIdParamSchema),
  asyncHandler(adminReactivateStore),
);

