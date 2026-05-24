import type { Request, Response } from 'express';

import { prisma } from '../prisma/client.js';

export const getHealth = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      service: 'munchies-api',
      database: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'munchies-api',
      database: 'unavailable',
    });
  }
};
