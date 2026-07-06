import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

// Dual-mode: against the LIVE deployed URL when TEST_BASE_URL is set (deploy.yml post-deploy gate),
// otherwise in-process via supertest (the CI `test:e2e` job). vitest reserves BASE_URL, so the
// deploy workflow passes the live base as TEST_BASE_URL.
const baseUrl = process.env.TEST_BASE_URL;
const target = baseUrl ?? createApp();

describe('app (e2e)', () => {
  it('reports health without dependencies', async () => {
    const response = await request(target).get('/healthz').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
