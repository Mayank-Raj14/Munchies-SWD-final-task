import { Router } from 'express';
import { Role } from '@prisma/client';

import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  adminListStores,
  adminUserSearch,
} from '../controllers/admin.controller.js';
import { validateRequest } from '../middleware/validate-request.js';
import { adminQuerySchema, storeIdParamSchema } from '../validators/admin.validator.js';


export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(Role.ADMIN));

adminRouter.get('/users', validateRequest(adminQuerySchema), asyncHandler(adminUserSearch));
adminRouter.get('/stores', asyncHandler(adminListStores));


