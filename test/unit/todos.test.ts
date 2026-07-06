import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { _resetStore } from '../../src/store/todoStore.js';

const app = createApp();

afterEach(() => {
  _resetStore();
});

describe('GET /api/todos', () => {
  it('returns 200 and empty array when no todos exist', async () => {
    const res = await request(app).get('/api/todos').expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 and array of todos after creation', async () => {
    await request(app).post('/api/todos').send({ title: 'First' });
    const res = await request(app).get('/api/todos').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('First');
  });
});

describe('POST /api/todos', () => {
  it('returns 201 and todo with server-assigned fields', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'Buy milk' }).expect(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe('Buy milk');
    expect(res.body.completed).toBe(false);
    expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('ignores client-supplied id, completed, and createdAt', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Test', id: 'client-id', completed: true, createdAt: '2000-01-01T00:00:00.000Z' })
      .expect(201);
    expect(res.body.id).not.toBe('client-id');
    expect(res.body.completed).toBe(false);
    expect(res.body.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('is retrievable after creation', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Retrievable' }).expect(201);
    const getRes = await request(app).get(`/api/todos/${createRes.body.id}`).expect(200);
    expect(getRes.body).toEqual(createRes.body);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/todos').send({}).expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/api/todos').send({ title: '' }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is a number', async () => {
    const res = await request(app).post('/api/todos').send({ title: 42 }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is null', async () => {
    const res = await request(app).post('/api/todos').send({ title: null }).expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('does not persist on invalid POST', async () => {
    await request(app).post('/api/todos').send({ title: '' });
    const res = await request(app).get('/api/todos').expect(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/todos/:id', () => {
  it('returns 200 and the todo for an existing id', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Fetch me' }).expect(201);
    const res = await request(app).get(`/api/todos/${createRes.body.id}`).expect(200);
    expect(res.body).toEqual(createRes.body);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/todos/nonexistent-id').expect(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });
});

describe('PUT /api/todos/:id', () => {
  it('returns 200 and updated title', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Old title' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: 'New title' })
      .expect(200);
    expect(res.body.title).toBe('New title');
    expect(res.body.completed).toBe(false);
  });

  it('returns 200 and updated completed status', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ completed: true })
      .expect(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.title).toBe('Task');
  });

  it('returns 200 when updating both title and completed', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Old' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: 'Updated', completed: true })
      .expect(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.completed).toBe(true);
  });

  it('never mutates id or createdAt', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Immutable' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: 'Changed', id: 'hacked', createdAt: '1970-01-01T00:00:00.000Z' })
      .expect(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.createdAt).toBe(createRes.body.createdAt);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/todos/nonexistent-id').send({ title: 'X' }).expect(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 400 when title is empty string', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: '' })
      .expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is whitespace', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: '   ' })
      .expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when title is not a string', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ title: 123 })
      .expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 when completed is not a boolean', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({ completed: 'yes' })
      .expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });

  it('returns 400 for empty body (no updatable field)', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Task' }).expect(201);
    const res = await request(app)
      .put(`/api/todos/${createRes.body.id}`)
      .send({})
      .expect(400);
    expect(res.body).toEqual({ error: 'Invalid request payload' });
  });
});

describe('DELETE /api/todos/:id', () => {
  it('returns 204 for existing todo', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Delete me' }).expect(201);
    await request(app).delete(`/api/todos/${createRes.body.id}`).expect(204);
  });

  it('GET returns 404 after deletion', async () => {
    const createRes = await request(app).post('/api/todos').send({ title: 'Gone' }).expect(201);
    await request(app).delete(`/api/todos/${createRes.body.id}`).expect(204);
    const res = await request(app).get(`/api/todos/${createRes.body.id}`).expect(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/todos/nonexistent-id').expect(404);
    expect(res.body).toEqual({ error: 'Todo not found' });
  });
});

describe('Round-trip: create → get → update → delete → 404', () => {
  it('full lifecycle', async () => {
    // Create
    const createRes = await request(app).post('/api/todos').send({ title: 'Lifecycle' }).expect(201);
    const { id } = createRes.body;

    // Get
    const getRes = await request(app).get(`/api/todos/${id}`).expect(200);
    expect(getRes.body.title).toBe('Lifecycle');

    // Update
    const updateRes = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'Updated lifecycle', completed: true })
      .expect(200);
    expect(updateRes.body.title).toBe('Updated lifecycle');
    expect(updateRes.body.completed).toBe(true);

    // Delete
    await request(app).delete(`/api/todos/${id}`).expect(204);

    // 404 after delete
    await request(app).get(`/api/todos/${id}`).expect(404);
  });
});

describe('Non-regression: healthz, /, unknown route', () => {
  it('GET /healthz → 200 {status:"ok"}', async () => {
    const res = await request(app).get('/healthz').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET / → 200 (serves static placeholder)', async () => {
    await request(app).get('/').expect(200);
  });

  it('GET /api/does-not-exist → 404', async () => {
    await request(app).get('/api/does-not-exist').expect(404);
  });

  it('GET /unknown → 404', async () => {
    await request(app).get('/unknown-route-xyz').expect(404);
  });
});
