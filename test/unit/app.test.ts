import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('app (unit)', () => {
  it('reports health', async () => {
    const app = createApp();
    const response = await request(app).get('/healthz').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const app = createApp();
    await request(app).get('/api/does-not-exist').expect(404);
  });
});
