import { env } from '../config/env.js';
import { ensureDefaultHostels } from '../services/hostel.service.js';
import { synchronizeCampaignActivity } from '../services/campaign.service.js';
import { cleanupExpiredCache } from '../utils/cache.js';
import { expireUncollectedOrders } from './order-expiry.job.js';

const ORDER_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
const CAMPAIGN_SYNC_INTERVAL_MS = 60 * 1000;
const CACHE_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

let jobsStarted = false;

const scheduleJob = (name: string, intervalMs: number, job: () => Promise<unknown>) => {
  let isRunning = false;

  const run = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      await job();
    } catch (error) {
      console.error(`${name} job failed`, error);
    } finally {
      isRunning = false;
    }
  };

  void run();
  setInterval(run, intervalMs).unref();
};

export const startBackgroundJobs = () => {
  if (env.NODE_ENV === 'test') {
    return;
  }

  if (jobsStarted) {
    return;
  }

  jobsStarted = true;

  void ensureDefaultHostels().catch((error) => {
    console.error('Default hostel seed failed', error);
  });

  scheduleJob('Order expiry', ORDER_EXPIRY_INTERVAL_MS, expireUncollectedOrders);
  scheduleJob('Campaign sync', CAMPAIGN_SYNC_INTERVAL_MS, synchronizeCampaignActivity);
  scheduleJob('Cache cleanup', CACHE_CLEANUP_INTERVAL_MS, async () => cleanupExpiredCache());
};
