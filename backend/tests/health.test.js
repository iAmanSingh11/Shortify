import request from 'supertest';
import app from '../src/app.js';

describe('Health endpoints', () => {
  it('GET /health returns 200 with uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.uptime).toEqual(expect.any(Number));
  });

  it('GET /health/live returns 200', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('GET /health/ready reports mongo connectivity', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body.data.mongo).toEqual(expect.any(String));
  });

  it('exposes the OpenAPI spec as JSON', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toEqual(expect.any(String));
    expect(res.body.info.title).toBe('shortify API');
  });
});
