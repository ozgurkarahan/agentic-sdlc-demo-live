import { describe, expect, it } from 'vitest';
import { parseConfig } from '../../src/config.js';

describe('parseConfig', () => {
  it('uses safe defaults when env vars are absent', () => {
    expect(parseConfig({})).toEqual({
      port: 3000,
      baseUrl: 'http://localhost:3000',
      rateLimit: { max: 100, windowMs: 60_000 },
    });
  });

  it('reads configured values from the environment', () => {
    expect(parseConfig({ PORT: '8080', BASE_URL: 'https://short.example' })).toEqual({
      port: 8080,
      baseUrl: 'https://short.example',
      rateLimit: { max: 100, windowMs: 60_000 },
    });
  });

  it('falls back to safe defaults when configured values are invalid', () => {
    expect(parseConfig({ PORT: 'not-a-port', BASE_URL: '/' })).toEqual({
      port: 3000,
      baseUrl: 'http://localhost:3000',
      rateLimit: { max: 100, windowMs: 60_000 },
    });
  });

  it('reads RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS from the environment', () => {
    const result = parseConfig({ RATE_LIMIT_MAX: '50', RATE_LIMIT_WINDOW_MS: '30000' });
    expect(result.rateLimit).toEqual({ max: 50, windowMs: 30_000 });
  });

  it('falls back to safe defaults when rate-limit env vars are invalid', () => {
    const result = parseConfig({ RATE_LIMIT_MAX: 'not-a-number', RATE_LIMIT_WINDOW_MS: '-1' });
    expect(result.rateLimit).toEqual({ max: 100, windowMs: 60_000 });
  });

  it('falls back to safe defaults when rate-limit env vars are zero', () => {
    const result = parseConfig({ RATE_LIMIT_MAX: '0', RATE_LIMIT_WINDOW_MS: '0' });
    expect(result.rateLimit).toEqual({ max: 100, windowMs: 60_000 });
  });
});

