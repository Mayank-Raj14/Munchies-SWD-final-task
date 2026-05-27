import type { RequestHandler } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const rateLimit = (options: {
  keyPrefix: string;
  max: number;
  windowMs: number;
}): RequestHandler => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${req.ip}:${req.headers.authorization ?? ''}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > options.max) {
      res.status(429).json({ message: 'Too many requests. Please wait and try again.' });
      return;
    }

    next();
  };
};
