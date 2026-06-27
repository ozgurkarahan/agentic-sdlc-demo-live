import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../../src/middleware/rateLimit.js';

function buildApp(max: number, windowMs: number) {
  const app = express();
  process.env.RATE_LIMIT_MAX = String(max);
  process.env.RATE_LIMIT_WINDOW_MS = String(windowMs);
  app.use(createRateLimiter());
  app.get('/test', (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('createRateLimiter', () => {
  const originalMax = process.env.RATE_LIMIT_MAX;
  const originalWindow = process.env.RATE_LIMIT_WINDOW_MS;

  afterEach(() => {
    if (originalMax === undefined) {
      delete process.env.RATE_LIMIT_MAX;
    } else {
      process.env.RATE_LIMIT_MAX = originalMax;
    }
    if (originalWindow === undefined) {
      delete process.env.RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.RATE_LIMIT_WINDOW_MS = originalWindow;
    }
  });

  it('allows requests under the threshold', async () => {
    const app = buildApp(3, 60_000);

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBe('3');
    }
  });

  it('returns 429 when the threshold is exceeded', async () => {
    const app = buildApp(2, 60_000);

    await request(app).get('/test');
    await request(app).get('/test');
    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
  });

  it('sets Retry-After header on 429', async () => {
    const app = buildApp(1, 60_000);

    await request(app).get('/test');
    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
    const retryAfter = Number(res.headers['retry-after']);
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
  });

  it('sets RateLimit-Limit and RateLimit-Remaining headers on 429', async () => {
    const app = buildApp(1, 60_000);

    await request(app).get('/test');
    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
    expect(res.headers['ratelimit-limit']).toBe('1');
    expect(res.headers['ratelimit-remaining']).toBe('0');
  });

  it('decrements RateLimit-Remaining as requests are made', async () => {
    const app = buildApp(5, 60_000);

    const first = await request(app).get('/test');
    expect(first.headers['ratelimit-remaining']).toBe('4');

    const second = await request(app).get('/test');
    expect(second.headers['ratelimit-remaining']).toBe('3');
  });

  it('defaults to a high max when env vars are unset', async () => {
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;

    const app = express();
    app.use(createRateLimiter());
    app.get('/test', (_req, res) => res.status(200).json({ ok: true }));

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    const limit = Number(res.headers['ratelimit-limit']);
    expect(limit).toBeGreaterThanOrEqual(100);
  });
});
