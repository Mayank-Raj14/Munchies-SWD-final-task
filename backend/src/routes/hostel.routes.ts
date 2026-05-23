import { Router } from 'express';

import { getHostels } from '../controllers/hostel.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const hostelRouter = Router();

hostelRouter.get('/', asyncHandler(getHostels));
