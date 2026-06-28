import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseConfig } from '../../src/config.js';

describe('input validation', () => {
  afterEach(() => {
    delete process.env.MAX_URL_LEN;
    vi.resetModules();
  });

  it('parses MAX_URL_LEN from the environment and falls back to the default for invalid values', () => {
    expect(parseConfig({}).maxUrlLen).toBe(2048);
    expect(parseConfig({ MAX_URL_LEN: '4096' }).maxUrlLen).toBe(4096);
    expect(parseConfig({ MAX_URL_LEN: '0' }).maxUrlLen).toBe(2048);
    expect(parseConfig({ MAX_URL_LEN: '-1' }).maxUrlLen).toBe(2048);
  });

  it('rejects URLs longer than the configured maximum without storing them', async () => {
    process.env.MAX_URL_LEN = '25';

    const { createApp } = await import('../../src/app.js');
    const app = createApp();
    const response = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/too-long' })
      .expect(400);

    expect(response.body).toEqual({ error: 'URL must be at most 25 characters long' });

    const listResponse = await request(app).get('/api/links').expect(200);
    expect(listResponse.body).toEqual([]);
  });

  it('accepts URLs within the configured maximum and preserves invalid-url handling', async () => {
    process.env.MAX_URL_LEN = '24';

    const { createApp } = await import('../../src/app.js');
    const app = createApp();
    await request(app)
      .post('/shorten')
      .send({ url: 'https://x.co/1234567890' })
      .expect(201);

    const invalidResponse = await request(app)
      .post('/shorten')
      .send({ url: 'ftp://example.com' })
      .expect(400);

    expect(invalidResponse.body).toEqual({ error: 'A valid http or https url is required' });
  });
});
