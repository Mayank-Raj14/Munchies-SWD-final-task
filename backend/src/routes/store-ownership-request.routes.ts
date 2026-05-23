import { Router } from 'express';

import {
  adminRole,
  approveRequest,
  createRequest,
  listPendingRequests,
  rejectRequest,
} from '../controllers/store-ownership-request.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createStoreOwnershipRequestSchema,
  requestIdParamSchema,
} from '../validators/store-ownership-request.validator.js';

export const storeOwnershipRequestRouter = Router();
export const adminStoreOwnershipRequestRouter = Router();

storeOwnershipRequestRouter.post(
  '/',
  authenticate,
  validateRequest(createStoreOwnershipRequestSchema),
  asyncHandler(createRequest),
);

adminStoreOwnershipRequestRouter.use(authenticate, requireRole(adminRole));
adminStoreOwnershipRequestRouter.get('/', asyncHandler(listPendingRequests));
adminStoreOwnershipRequestRouter.patch(
  '/:id/approve',
  validateRequest(requestIdParamSchema),
  asyncHandler(approveRequest),
);
adminStoreOwnershipRequestRouter.patch(
  '/:id/reject',
  validateRequest(requestIdParamSchema),
  asyncHandler(rejectRequest),
);
