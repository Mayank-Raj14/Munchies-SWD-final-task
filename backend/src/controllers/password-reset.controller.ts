import type { Request, Response } from 'express';

import {
  requestPasswordReset,
  resetPassword,
  verifyResetCode,
} from '../services/password-reset.service.js';

export const forgotPassword = async (req: Request, res: Response) => {
  await requestPasswordReset(req.body.email);
  // Always return 200 to prevent email enumeration
  res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
};

export const verifyCode = async (req: Request, res: Response) => {
  await verifyResetCode(req.body.email, req.body.code);
  res.status(200).json({ valid: true });
};

export const confirmReset = async (req: Request, res: Response) => {
  await resetPassword(req.body.email, req.body.code, req.body.newPassword);
  res.status(200).json({ message: 'Password updated successfully.' });
};