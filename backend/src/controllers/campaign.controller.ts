import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createCampaign,
  deactivateCampaign,
  listCampaignsForStore,
  updateCampaign,
  validateCouponForCart,
} from '../services/campaign.service.js';

export const createStoreCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const campaign = await createCampaign(req.user!, req.body);

  res.status(201).json({ campaign });
};

export const getStoreCampaigns = async (req: AuthenticatedRequest, res: Response) => {
  const campaigns = await listCampaignsForStore(String(req.query.storeId), req.user);

  res.status(200).json({ campaigns });
};

export const updateStoreCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const campaign = await updateCampaign(req.params.campaignId ?? '', req.user!, req.body);

  res.status(200).json({ campaign });
};

export const deactivateStoreCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const campaign = await deactivateCampaign(req.params.campaignId ?? '', req.user!);

  res.status(200).json({ campaign });
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const result = await validateCouponForCart(req.user?.id ?? '', req.body.cartId, req.body.code);

  res.status(200).json({
    campaign: result.campaign,
    subtotalAmount: result.subtotalAmount,
    discountAmount: result.discountAmount,
    totalAmount: result.totalAmount,
  });
};
