import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';

export type JwtPayload = {
  userId: string;
  role: 'USER' | 'STORE_OWNER' | 'ADMIN';
};

export const signAuthToken = (payload: JwtPayload) => {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  });
};

export const verifyAuthToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
