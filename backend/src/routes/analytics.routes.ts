import { Role } from '@prisma/client';
import { Router } from 'express';

import { getAnalyticsForStore, getMyAnalytics } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  storeAnalyticsParamSchema,
  userAnalyticsQuerySchema,
} from '../validators/analytics.validator.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, requireRole(Role.USER, Role.STORE_OWNER, Role.ADMIN));
analyticsRouter.get(
  '/users/me',
  validateRequest(userAnalyticsQuerySchema),
  asyncHandler(getMyAnalytics),
);
analyticsRouter.get(
  '/stores/:storeId',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(storeAnalyticsParamSchema),
  asyncHandler(getAnalyticsForStore),
);
