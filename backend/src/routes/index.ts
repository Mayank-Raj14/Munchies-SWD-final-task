import { Router } from 'express';

import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import {
  adminStoreOwnershipRequestRouter,
  storeOwnershipRequestRouter,
} from './store-ownership-request.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/store-ownership-requests', storeOwnershipRequestRouter);
apiRouter.use('/admin/store-ownership-requests', adminStoreOwnershipRequestRouter);
