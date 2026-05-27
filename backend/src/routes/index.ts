import { Router } from 'express';

import { analyticsRouter } from './analytics.routes.js';
import { authRouter } from './auth.routes.js';
import { bookingRouter } from './booking.routes.js';
import { campaignRouter } from './campaign.routes.js';
import { cartRouter } from './cart.routes.js';
import { adminGovernanceRouter, governanceRouter } from './governance.routes.js';
import { healthRouter } from './health.routes.js';
import { hostelRouter } from './hostel.routes.js';
import { storeRouter } from './store.routes.js';
import {
  adminStoreOwnershipRequestRouter,
  storeOwnershipRequestRouter,
} from './store-ownership-request.routes.js';

export const apiRouter = Router();

apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/campaigns', campaignRouter);
apiRouter.use('/carts', cartRouter);
apiRouter.use('/governance', governanceRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/hostels', hostelRouter);
apiRouter.use('/stores', storeRouter);
apiRouter.use('/store-ownership-requests', storeOwnershipRequestRouter);
apiRouter.use('/admin/governance', adminGovernanceRouter);
apiRouter.use('/admin/store-ownership-requests', adminStoreOwnershipRequestRouter);
