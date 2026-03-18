import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import request from 'supertest';
import { messageResponse } from '../../../src/enum/messageResponse.js';
import { makeUserPayload } from '../../shared/testData.js';
import { bddContext } from '../support/hooks.js';

Given('que eu possuo dados validos para cadastro', async () => {
  bddContext.payload = makeUserPayload();
});

Given('que existe um usuario cadastrado', async () => {
  const payload = makeUserPayload();
  bddContext.payload = payload;
  bddContext.response = await request(bddContext.app!)
    .post('/user')
    .send(payload);
});

When('eu envio a requisicao de cadastro', async () => {
  assert.ok(bddContext.payload);
  bddContext.response = await request(bddContext.app!)
    .post('/user')
    .send(bddContext.payload);
});

When('eu tento autenticar com senha invalida', async () => {
  bddContext.response = await request(bddContext.app!)
    .post('/login')
    .send({
      email: bddContext.payload?.email,
      password: 'senha-incorreta',
    });
});

When('eu acesso a rota protegida sem token', async () => {
  bddContext.response = await request(bddContext.app!)
    .get('/ping');
});

Then('o cadastro deve ser concluido com sucesso', () => {
  assert.equal(bddContext.response?.status, 201);
  assert.equal(bddContext.response?.body.email, bddContext.payload?.email);
});

Then('a autenticacao deve falhar com credenciais invalidas', () => {
  assert.equal(bddContext.response?.status, 200);
  assert.deepEqual(bddContext.response?.body, {
    auth: false,
    message: messageResponse.INVALID_CREDENTIALS,
  });
});

Then('o acesso deve ser negado', () => {
  assert.equal(bddContext.response?.status, 401);
  assert.deepEqual(bddContext.response?.body, {
    auth: false,
    message: 'No token provided.',
  });
});