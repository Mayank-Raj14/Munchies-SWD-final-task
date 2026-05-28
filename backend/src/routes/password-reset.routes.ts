import { Router } from 'express';

import {
  confirmReset,
  forgotPassword,
  verifyCode,
} from '../controllers/password-reset.controller.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  confirmResetSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
} from '../validators/password-reset.validator.js';

export const passwordResetRouter = Router();

const resetRateLimit = rateLimit({ keyPrefix: 'pwd-reset', max: 5, windowMs: 15 * 60 * 1000 });

passwordResetRouter.post(
  '/forgot-password',
  resetRateLimit,
  validateRequest(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);

passwordResetRouter.post(
  '/verify-reset-code',
  resetRateLimit,
  validateRequest(verifyCodeSchema),
  asyncHandler(verifyCode),
);

passwordResetRouter.post(
  '/reset-password',
  resetRateLimit,
  validateRequest(confirmResetSchema),
  asyncHandler(confirmReset),
);