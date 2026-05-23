import type { Request, Response } from 'express';

import { listHostels } from '../services/hostel.service.js';

export const getHostels = async (_req: Request, res: Response) => {
  const hostels = await listHostels();

  res.status(200).json({ hostels });
};
