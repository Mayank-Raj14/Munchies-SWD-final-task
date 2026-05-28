import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
  }),
});

export const verifyCodeSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    code: z.string().trim().length(6, 'Code must be 6 digits'),
  }),
});

export const confirmResetSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    code: z.string().trim().length(6, 'Code must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});