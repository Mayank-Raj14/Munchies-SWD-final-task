import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getUserById, loginUser, registerUser } from '../services/auth.service.js';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const result = await registerUser(req.body);

  res.status(201).json(result);
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json(result);
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  const user = await getUserById(req.user?.id ?? '');

  res.status(200).json({ user });
};
