import request from 'supertest';
import app from '../src/app.js';

const VALID_PASSWORD = 'Passw0rd!';

const register = (email, extra = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: VALID_PASSWORD, ...extra });

describe('RBAC: admin routes', () => {
  let userToken;
  let adminToken;

  beforeEach(async () => {
    const userRes = await register('regular@example.com');
    userToken = userRes.body.data.accessToken;

    const adminRes = await register(process.env.BOOTSTRAP_ADMIN_EMAIL);
    adminToken = adminRes.body.data.accessToken;
  });

  it('rejects a regular user from the admin overview endpoint', async () => {
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin to view the overview', async () => {
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('allows an admin to list all users', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });

  it('prevents an admin from deactivating their own account', async () => {
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const adminId = meRes.body.data.user.id;

    const res = await request(app)
      .patch(`/api/admin/users/${adminId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(res.status).toBe(400);
  });

  it('allows an admin to promote a user to admin', async () => {
    const usersRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    const targetUser = usersRes.body.data.users.find((u) => u.email === 'regular@example.com');

    const res = await request(app)
      .patch(`/api/admin/users/${targetUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('rejects unauthenticated requests to admin routes', async () => {
    const res = await request(app).get('/api/admin/overview');
    expect(res.status).toBe(401);
  });
});

describe('API keys', () => {
  let token;

  beforeEach(async () => {
    const res = await register('apikeyuser@example.com');
    token = res.body.data.accessToken;
  });

  it('creates an API key and returns the raw key exactly once', async () => {
    const res = await request(app)
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'CI script' });

    expect(res.status).toBe(201);
    expect(res.body.data.rawKey).toEqual(expect.any(String));
    expect(res.body.data.apiKey.keyPrefix).toEqual(expect.any(String));
  });

  it('authenticates a request using the created API key', async () => {
    const createRes = await request(app)
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'CI script' });
    const rawKey = createRes.body.data.rawKey;

    const res = await request(app)
      .post('/api/urls')
      .set('X-API-Key', rawKey)
      .send({ originalUrl: 'https://example.com/via-api-key' });

    expect(res.status).toBe(201);
  });

  it('rejects an invalid API key', async () => {
    const res = await request(app).post('/api/urls').set('X-API-Key', 'shortify_invalidkey').send({
      originalUrl: 'https://example.com',
    });
    expect(res.status).toBe(401);
  });
});
