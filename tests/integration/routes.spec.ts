import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { messageResponse } from '../../src/enum/messageResponse.js';
import { getTestApp, resetDatabase } from '../shared/testEnvironment.js';
import { makeUserPayload } from '../shared/testData.js';

describe('Rotas principais', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('cria usuário com persistência real no banco de testes', async () => {
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

  it('realiza login com credenciais válidas', async () => {
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

  it('permite acessar rota protegida com JWT válido', async () => {
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

  it('bloqueia acesso à rota protegida sem JWT', async () => {
    const response = await request(app)
      .get('/ping')
      .expect(401);

    expect(response.body).toEqual({ auth: false, message: 'No token provided.' });
  });
});