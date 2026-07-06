import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const targetBaseUrl = process.env.TEST_BASE_URL;
const testTarget = targetBaseUrl ?? createApp();

const iso8601UtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describe('todos (e2e)', () => {
  it('validates the complete CRUD contract in dual-mode', async () => {
    const marker = `e2e-live-${Date.now()}-${randomUUID()}`;
    const missingId = `missing-${randomUUID()}`;
    let createdId: string | undefined;

    try {
      const healthResponse = await request(testTarget).get('/healthz').expect(200);
      expect(healthResponse.body).toEqual({ status: 'ok' });

      const listResponse = await request(testTarget).get('/api/todos').expect(200);
      expect(Array.isArray(listResponse.body)).toBe(true);

      const createResponse = await request(testTarget).post('/api/todos').send({ title: marker }).expect(201);
      expect(createResponse.body.id).toBeTypeOf('string');
      expect(createResponse.body.id.length).toBeGreaterThan(0);
      expect(createResponse.body.title).toBe(marker);
      expect(createResponse.body.completed).toBe(false);
      expect(createResponse.body.createdAt).toMatch(iso8601UtcRegex);
      createdId = createResponse.body.id as string;

      await request(testTarget)
        .post('/api/todos')
        .send({})
        .expect(400, { error: 'Invalid request payload' });
      await request(testTarget)
        .post('/api/todos')
        .send({ title: '   ' })
        .expect(400, { error: 'Invalid request payload' });
      await request(testTarget)
        .post('/api/todos')
        .send({ title: 1 })
        .expect(400, { error: 'Invalid request payload' });

      const getCreatedResponse = await request(testTarget).get(`/api/todos/${createdId}`).expect(200);
      expect(getCreatedResponse.body.id).toBe(createdId);
      expect(getCreatedResponse.body.title).toBe(marker);
      expect(getCreatedResponse.body.completed).toBe(false);
      expect(getCreatedResponse.body.createdAt).toMatch(iso8601UtcRegex);

      await request(testTarget).get(`/api/todos/${missingId}`).expect(404, { error: 'Todo not found' });

      const updateResponse = await request(testTarget)
        .put(`/api/todos/${createdId}`)
        .send({ completed: true })
        .expect(200);
      expect(updateResponse.body.id).toBe(createdId);
      expect(updateResponse.body.completed).toBe(true);

      await request(testTarget)
        .put(`/api/todos/${createdId}`)
        .send({})
        .expect(400, { error: 'Invalid request payload' });
      await request(testTarget)
        .put(`/api/todos/${missingId}`)
        .send({ completed: true })
        .expect(404, { error: 'Todo not found' });

      const deletedId = createdId;
      const deleteResponse = await request(testTarget).delete(`/api/todos/${deletedId}`).expect(204);
      expect(deleteResponse.text).toBe('');
      createdId = undefined;

      await request(testTarget).get(`/api/todos/${deletedId}`).expect(404, {
        error: 'Todo not found',
      });
      await request(testTarget).delete(`/api/todos/${missingId}`).expect(404, {
        error: 'Todo not found',
      });
    } finally {
      if (createdId) {
        const cleanupResponse = await request(testTarget).delete(`/api/todos/${createdId}`);
        expect([204, 404]).toContain(cleanupResponse.status);
      }
    }
  });
});
