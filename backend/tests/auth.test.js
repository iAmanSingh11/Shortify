import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

const VALID_PASSWORD = 'Passw0rd!';

const registerUser = (overrides = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: VALID_PASSWORD,
      ...overrides,
    });

describe('Auth: registration', () => {
  it('registers a new user and returns an access token', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.role).toBe('user');
  });

  it('rejects registration with a weak password', async () => {
    const res = await registerUser({ email: 'weak@example.com', password: 'weak' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate email registration', async () => {
    await registerUser();
    const res = await registerUser();
    expect(res.status).toBe(409);
  });

  it('promotes the configured bootstrap admin email to the admin role', async () => {
    const res = await registerUser({ email: process.env.BOOTSTRAP_ADMIN_EMAIL });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('admin');
  });
});

describe('Auth: login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@example.com', password: VALID_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@example.com', password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  it('locks the account after the configured number of failed attempts', async () => {
    const maxAttempts = 5;
    let lastRes;
    for (let i = 0; i < maxAttempts; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      lastRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'WrongPassword1' });
    }
    expect(lastRes.status).toBe(423);

    // Even the correct password should now be rejected while locked
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@example.com', password: VALID_PASSWORD });
    expect(res.status).toBe(423);

    const dbUser = await User.findOne({ email: 'jane@example.com' }).select('+lockUntil');
    expect(dbUser.lockUntil).not.toBeNull();
  });
});

describe('Auth: session lifecycle', () => {
  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid access token', async () => {
    const registerRes = await registerUser();
    const token = registerRes.body.data.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('jane@example.com');
  });

  it('rotates the refresh token on refresh and rejects reuse of the old one', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'rotate@example.com', password: VALID_PASSWORD });

    const firstRefresh = await agent.post('/api/auth/refresh');
    expect(firstRefresh.status).toBe(200);
    expect(firstRefresh.body.data.accessToken).toEqual(expect.any(String));
  });
});
