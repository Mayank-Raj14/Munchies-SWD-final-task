import { Role } from '@prisma/client';
import { Router } from 'express';

import {
  createStoreCampaign,
  deleteStoreCampaign,
  getStoreCampaigns,
  toggleStoreCampaign,
  updateStoreCampaign,
  validateCoupon,
} from '../controllers/campaign.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  campaignParamSchema,
  createCampaignSchema,
  listCampaignsSchema,
  updateCampaignSchema,
  validateCouponSchema,
} from '../validators/campaign.validator.js';

export const campaignRouter = Router();

campaignRouter.use(authenticate);
campaignRouter.post(
  '/validate',
  validateRequest(validateCouponSchema),
  asyncHandler(validateCoupon),
);
campaignRouter.get(
  '/',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(listCampaignsSchema),
  asyncHandler(getStoreCampaigns),
);
campaignRouter.post(
  '/',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(createCampaignSchema),
  asyncHandler(createStoreCampaign),
);
campaignRouter.patch(
  '/:campaignId',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(updateCampaignSchema),
  asyncHandler(updateStoreCampaign),
);
campaignRouter.patch(
  '/:campaignId/deactivate',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(campaignParamSchema),
  asyncHandler(toggleStoreCampaign),
);
campaignRouter.delete(
  '/:campaignId',
  requireRole(Role.STORE_OWNER, Role.ADMIN),
  validateRequest(campaignParamSchema),
  asyncHandler(deleteStoreCampaign),
);
