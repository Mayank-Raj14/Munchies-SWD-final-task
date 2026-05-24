import { z } from 'zod';

const reasonBody = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
});

export const userGovernanceParamSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user id'),
  }),
});

export const userGovernanceActionSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user id'),
  }),
  body: reasonBody,
});

export const storeUserGovernanceParamSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
    userId: z.string().uuid('Invalid user id'),
  }),
});

export const storeUserGovernanceActionSchema = z.object({
  params: z.object({
    storeId: z.string().uuid('Invalid store id'),
    userId: z.string().uuid('Invalid user id'),
  }),
  body: reasonBody,
});
