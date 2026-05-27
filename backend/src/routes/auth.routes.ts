import { Router } from 'express';

import {
  getCurrentUser,
  login,
  register,
  updateCurrentUserEmailPreferences,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  emailPreferencesSchema,
  loginSchema,
  registerSchema,
} from '../validators/auth.validator.js';

export const authRouter = Router();

const authRateLimit = rateLimit({ keyPrefix: 'auth', max: 20, windowMs: 15 * 60 * 1000 });

authRouter.post(
  '/register',
  authRateLimit,
  validateRequest(registerSchema),
  asyncHandler(register),
);
authRouter.post('/login', authRateLimit, validateRequest(loginSchema), asyncHandler(login));
authRouter.get('/me', authenticate, asyncHandler(getCurrentUser));
authRouter.patch(
  '/me/email-preferences',
  authenticate,
  validateRequest(emailPreferencesSchema),
  asyncHandler(updateCurrentUserEmailPreferences),
);
