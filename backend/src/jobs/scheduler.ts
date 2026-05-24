import { env } from '../config/env.js';
import { ensureDefaultHostels } from '../services/hostel.service.js';
import { expireUncollectedOrders } from './order-expiry.job.js';

const ORDER_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;

export const startBackgroundJobs = () => {
  if (env.NODE_ENV === 'test') {
    return;
  }

  const runExpiry = async () => {
    try {
      await expireUncollectedOrders();
    } catch (error) {
      console.error('Order expiry job failed', error);
    }
  };

  void ensureDefaultHostels().catch((error) => {
    console.error('Default hostel seed failed', error);
  });

  void runExpiry();
  setInterval(runExpiry, ORDER_EXPIRY_INTERVAL_MS).unref();
};
