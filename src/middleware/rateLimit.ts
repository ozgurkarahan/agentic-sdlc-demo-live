import type { Request, Response, NextFunction, RequestHandler } from 'express';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const DEFAULT_MAX = 1000;
const DEFAULT_WINDOW_MS = 60_000;

export function createRateLimiter(): RequestHandler {
  const max = parseInt(process.env.RATE_LIMIT_MAX ?? String(DEFAULT_MAX), 10) || DEFAULT_MAX;
  const windowMs =
    parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? String(DEFAULT_WINDOW_MS), 10) || DEFAULT_WINDOW_MS;

  const store = new Map<string, RateLimitEntry>();

  return (request: Request, response: Response, next: NextFunction): void => {
    // Use req.ip which respects Express's trust proxy setting, avoiding header spoofing.
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    const now = Date.now();

    // Purge expired entries to prevent unbounded memory growth.
    for (const [ip, entry] of store) {
      if (now - entry.windowStart >= windowMs) {
        store.delete(ip);
      }
    }

    const entry = store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(key, { count: 1, windowStart: now });
      response.setHeader('RateLimit-Limit', max);
      response.setHeader('RateLimit-Remaining', max - 1);
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
      response.setHeader('RateLimit-Limit', max);
      response.setHeader('RateLimit-Remaining', 0);
      response.setHeader('Retry-After', retryAfterSec);
      response.status(429).json({ error: 'Too Many Requests' });
      return;
    }

    response.setHeader('RateLimit-Limit', max);
    response.setHeader('RateLimit-Remaining', max - entry.count);
    next();
  };
}
