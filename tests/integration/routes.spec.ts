import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { messageResponse } from '../../src/enum/messageResponse.js';
import { getTestApp, resetDatabase } from '../shared/testEnvironment.js';
import { makeUserPayload } from '../shared/testData.js';

describe('Core routes', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates user with real persistence in test database', async () => {
    const payload = makeUserPayload();

    const response = await request(app)
      .post('/user')
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: payload.name,
      email: payload.email,
    });
  });

  it('logs in with valid credentials', async () => {
    const payload = makeUserPayload();

    await request(app).post('/user').send(payload).expect(201);

    const response = await request(app)
      .post('/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(response.body).toMatchObject({
      auth: true,
      message: messageResponse.SUCESS_AUTH,
      token: expect.any(String),
    });
  });

  it('allows access to protected route with valid JWT', async () => {
    const payload = makeUserPayload();

    await request(app).post('/user').send(payload).expect(201);
    const loginResponse = await request(app)
      .post('/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const response = await request(app)
      .get('/ping')
      .set('authorization', loginResponse.body.token)
      .expect(200);

    expect(response.body).toEqual({ msg: 'pong' });
  });

  it('blocks access to protected route without JWT', async () => {
    const response = await request(app)
      .get('/ping')
      .expect(401);

    expect(response.body).toEqual({ auth: false, message: 'No token provided.' });
  });
});