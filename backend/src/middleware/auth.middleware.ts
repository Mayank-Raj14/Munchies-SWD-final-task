import type { Request, RequestHandler } from 'express';

import { getUserById, type AuthenticatedUser } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import { verifyAuthToken } from '../utils/jwt.js';

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const authenticate: RequestHandler = async (req: AuthenticatedRequest, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next(new AppError('Authentication token is required', 401));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await getUserById(payload.userId);

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch {
    next(new AppError('Invalid or expired authentication token', 401));
  }
};
