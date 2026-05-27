import { CampaignType } from '@prisma/client';
import { z } from 'zod';

const campaignBodyBase = z.object({
  storeId: z.string().uuid('Invalid store id'),
  code: z.string().trim().min(4).max(24).optional(),
  type: z.nativeEnum(CampaignType),
  value: z.coerce.number().positive().max(100000),
  minOrderValue: z.coerce.number().min(0).max(100000).default(0),
  globalUsageLimit: z.coerce.number().int().positive().nullable().optional(),
  perUserUsageLimit: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isActive: z.boolean().optional(),
});

const campaignBody = campaignBodyBase.refine((value) => value.endsAt > value.startsAt, {
  message: 'End time must be after start time',
  path: ['endsAt'],
});

export const createCampaignSchema = z.object({
  body: campaignBody,
});

export const updateCampaignSchema = z.object({
  params: z.object({
    campaignId: z.string().uuid('Invalid campaign id'),
  }),
  body: campaignBodyBase.omit({ storeId: true, code: true }).partial(),
});

export const campaignParamSchema = z.object({
  params: z.object({
    campaignId: z.string().uuid('Invalid campaign id'),
  }),
});

export const listCampaignsSchema = z.object({
  query: z.object({
    storeId: z.string().uuid('Invalid store id'),
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    cartId: z.string().uuid('Invalid cart id'),
    code: z.string().trim().min(1).max(24),
  }),
});
