import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { messageResponse } from '../../src/enum/messageResponse.js';
import { getTestApp, resetDatabase } from '../shared/testEnvironment.js';
import { makeUserPayload } from '../shared/testData.js';

describe('Seguranca - validacao de entrada e exposicao de dados (OWASP A02, A03, A08)', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMITER = 'true';
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('rejeita payloads invalidos para cadastro e autenticacao', async () => {
    const invalidRegistration = await request(app)
      .post('/user')
      .send({ name: 'A', email: 'email-invalido', password: '123' })
      .expect(400);

    const invalidLogin = await request(app)
      .post('/login')
      .send({ email: 'email-invalido', password: '' })
      .expect(400);

    expect(invalidRegistration.body).toEqual({ message: messageResponse.INVALID_REGISTRATION_DATA });
    expect(invalidLogin.body).toEqual({ auth: false, message: messageResponse.INVALID_AUTH_DATA });
  });

  it('ignora campos inesperados sem alterar comportamento de autenticacao', async () => {
    const payload = makeUserPayload();

    const created = await request(app)
      .post('/user')
      .send({
        ...payload,
        role: 'admin',
        isAdmin: true,
        metadata: { internal: 'secret' },
      })
      .expect(201);

    expect(created.body).toMatchObject({
      id: expect.any(Number),
      name: payload.name,
      email: payload.email,
    });

    expect(created.body.role).toBeUndefined();
    expect(created.body.isAdmin).toBeUndefined();
    expect(created.body.metadata).toBeUndefined();

    const login = await request(app)
      .post('/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    expect(login.body.auth).toBe(true);
  });

  it('nao expone senha, hash, salt nem detalhes internos nas respostas', async () => {
    const payload = makeUserPayload();

    const created = await request(app)
      .post('/user')
      .send(payload)
      .expect(201);

    expect(created.body.password).toBeUndefined();
    expect(created.body.senha).toBeUndefined();
    expect(created.body.salt).toBeUndefined();

    const maliciousLogin = await request(app)
      .post('/login')
      .send({
        email: { $gt: '' },
        password: { $gt: '' },
      })
      .expect(400);

    const message = JSON.stringify(maliciousLogin.body).toLowerCase();
    expect(message).not.toContain('prisma');
    expect(message).not.toContain('stack');
    expect(message).not.toContain('sql');
  });
});
