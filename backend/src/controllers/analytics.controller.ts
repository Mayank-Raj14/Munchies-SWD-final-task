import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getStoreAnalytics, getUserAnalytics } from '../services/analytics.service.js';

export const getMyAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  const analytics = await getUserAnalytics(req.user?.id ?? '', {
    dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
    dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
  });

  res.status(200).json({ analytics });
};

export const getAnalyticsForStore = async (req: AuthenticatedRequest, res: Response) => {
  const analytics = await getStoreAnalytics(req.params.storeId ?? '', req.user!, {
    dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
    dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
  });

  res.status(200).json({ analytics });
};
