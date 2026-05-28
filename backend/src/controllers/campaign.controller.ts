import type { Request } from 'express';
import { prisma } from '../prisma/client.js';
import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createCampaign,
  deleteCampaign,
  listCampaignsForStore,
  toggleCampaign,
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

export const toggleStoreCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const isActive = req.body.isActive !== false;
  const campaign = await toggleCampaign(req.params.campaignId ?? '', req.user!, isActive);

  res.status(200).json({ campaign });
};

export const deleteStoreCampaign = async (req: AuthenticatedRequest, res: Response) => {
  const campaign = await deleteCampaign(req.params.campaignId ?? '', req.user!);

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
export const getActiveCampaigns = async (_req: Request, res: Response) => {
  const now = new Date();

  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: {
      store: {
        select: { name: true, id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.status(200).json({ campaigns });
};