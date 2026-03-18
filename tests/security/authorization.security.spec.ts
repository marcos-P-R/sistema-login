import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getTestApp, resetDatabase } from '../shared/testEnvironment.js';
import { makeUserPayload } from '../shared/testData.js';

describe('Security - authorization and access control (OWASP A01)', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMITER = 'true';
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('denies access to protected route without authentication token', async () => {
    const response = await request(app)
      .get('/ping')
      .expect(401);

    expect(response.body.auth).toBe(false);
  });

  it('never returns 2xx for unauthenticated or malformed token requests to protected routes', async () => {
    const [withoutToken, withBadToken] = await Promise.all([
      request(app).get('/ping'),
      request(app).get('/ping').set('authorization', 'not-a-valid-token'),
    ]);

    expect(withoutToken.status).toBeGreaterThanOrEqual(400);
    expect(withBadToken.status).toBeGreaterThanOrEqual(400);
  });

  it('grants access to authenticated user presenting a valid JWT', async () => {
    const payload = makeUserPayload();

    await request(app).post('/user').send(payload).expect(201);

    const loginResponse = await request(app)
      .post('/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(loginResponse.body.auth).toBe(true);

    const protectedResponse = await request(app)
      .get('/ping')
      .set('authorization', String(loginResponse.body.token))
      .expect(200);

    expect(protectedResponse.body).toHaveProperty('msg', 'pong');
  });
});
