import request from 'supertest';
import app from '../src/app.js';

const VALID_PASSWORD = 'Passw0rd!';

const registerAndGetToken = async (email = 'urluser@example.com') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'URL User', email, password: VALID_PASSWORD });
  return res.body.data.accessToken;
};

describe('URL shortening', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndGetToken();
  });

  it('rejects link creation without authentication', async () => {
    const res = await request(app).post('/api/urls').send({ originalUrl: 'https://example.com' });
    expect(res.status).toBe(401);
  });

  it('creates a short link with a generated code', async () => {
    const res = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/some/long/path' });

    expect(res.status).toBe(201);
    expect(res.body.data.url.shortCode).toEqual(expect.any(String));
    expect(res.body.data.shortUrl).toContain(res.body.data.url.shortCode);
  });

  it('rejects an invalid destination URL', async () => {
    const res = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'not-a-valid-url' });
    expect(res.status).toBe(422);
  });

  it('creates a link with a custom alias and rejects a duplicate of that alias', async () => {
    const first = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/a', customAlias: 'my-brand' });
    expect(first.status).toBe(201);
    expect(first.body.data.url.shortCode).toBe('my-brand');

    const second = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/b', customAlias: 'my-brand' });
    expect(second.status).toBe(409);
  });

  it('rejects a reserved word as a custom alias', async () => {
    const res = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/c', customAlias: 'admin' });
    expect(res.status).toBe(400);
  });

  it('lists only the authenticated user\'s links', async () => {
    await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/mine' });

    const otherToken = await registerAndGetToken('other@example.com');
    await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ originalUrl: 'https://example.com/not-mine' });

    const res = await request(app).get('/api/urls').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.urls).toHaveLength(1);
    expect(res.body.data.urls[0].originalUrl).toBe('https://example.com/mine');
  });

  it('updates and then deletes a link', async () => {
    const createRes = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/update-me', title: 'Original' });

    const id = createRes.body.data.url._id;

    const updateRes = await request(app)
      .patch(`/api/urls/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.url.title).toBe('Updated title');

    const deleteRes = await request(app).delete(`/api/urls/${id}`).set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get(`/api/urls/${id}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});

describe('Redirects', () => {
  it('returns 404 for a short code that does not exist', async () => {
    const res = await request(app).get('/does-not-exist-xyz');
    expect(res.status).toBe(404);
  });

  it('redirects to the original URL for a valid short code', async () => {
    const token = await registerAndGetToken('redirectuser@example.com');
    const createRes = await request(app)
      .post('/api/urls')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalUrl: 'https://example.com/redirect-target', customAlias: 'go-here' });

    expect(createRes.status).toBe(201);

    const res = await request(app).get('/go-here');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/redirect-target');
  });
});
