import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { messageResponse } from '../../src/enum/messageResponse.js';
import { getTestApp, resetDatabase } from '../shared/testEnvironment.js';
import { makeUserPayload } from '../shared/testData.js';

describe('Security - authentication and authorization (OWASP A01, A07)', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMITER = 'true';
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    const payload = makeUserPayload();

    await request(app).post('/user').send(payload).expect(201);

    const wrongPassword = await request(app)
      .post('/login')
      .send({ email: payload.email, password: 'wrong-password' })
      .expect(200);

    const unknownEmail = await request(app)
      .post('/login')
      .send({ email: `not-found-${Date.now()}@example.com`, password: payload.password })
      .expect(200);

    expect(wrongPassword.body).toEqual({ auth: false, message: messageResponse.INVALID_CREDENTIALS });
    expect(unknownEmail.body).toEqual({ auth: false, message: messageResponse.INVALID_CREDENTIALS });
  });

  it('blocks protected route when token is missing', async () => {
    const response = await request(app)
      .get('/ping')
      .expect(401);

    expect(response.body).toEqual({ auth: false, message: 'No token provided.' });
  });

  it('blocks protected route when token is expired, malformed, or tampered', async () => {
    const payload = makeUserPayload();
    await request(app).post('/user').send(payload).expect(201);

    const loginResponse = await request(app)
      .post('/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const expiredToken = jwt.sign(
      { email: payload.email, name: payload.name },
      String(process.env.JWT_SECRET),
      { expiresIn: -10 },
    );

    const malformedToken = 'token.invalid';
    const tamperedToken = `${String(loginResponse.body.token).slice(0, -1)}x`;

    const [expiredResponse, malformedResponse, tamperedResponse] = await Promise.all([
      request(app).get('/ping').set('authorization', expiredToken),
      request(app).get('/ping').set('authorization', malformedToken),
      request(app).get('/ping').set('authorization', tamperedToken),
    ]);

    expect(expiredResponse.status).toBe(401);
    expect(malformedResponse.status).toBe(401);
    expect(tamperedResponse.status).toBe(401);

    expect(expiredResponse.body).toEqual({ auth: false, message: messageResponse.FAILED_TOKEN });
    expect(malformedResponse.body).toEqual({ auth: false, message: messageResponse.FAILED_TOKEN });
    expect(tamperedResponse.body).toEqual({ auth: false, message: messageResponse.FAILED_TOKEN });
  });
});
