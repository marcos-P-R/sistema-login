import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import request from 'supertest';
import { messageResponse } from '../../../src/enum/messageResponse.js';
import { makeUserPayload } from '../../shared/testData.js';
import { bddContext } from '../support/hooks.js';

Given('I have valid registration data', async () => {
  bddContext.payload = makeUserPayload();
});

Given('there is a registered user', async () => {
  const payload = makeUserPayload();
  bddContext.payload = payload;
  bddContext.response = await request(bddContext.app!)
    .post('/user')
    .send(payload);
});

When('I send a registration request', async () => {
  assert.ok(bddContext.payload);
  bddContext.response = await request(bddContext.app!)
    .post('/user')
    .send(bddContext.payload);
});

When('I try to authenticate with an invalid password', async () => {
  bddContext.response = await request(bddContext.app!)
    .post('/login')
    .send({
      email: bddContext.payload?.email,
      password: 'wrong-password',
    });
});

When('I access the protected route without a token', async () => {
  bddContext.response = await request(bddContext.app!)
    .get('/ping');
});

Then('registration should succeed', () => {
  assert.equal(bddContext.response?.status, 201);
  assert.equal(bddContext.response?.body.email, bddContext.payload?.email);
});

Then('authentication should fail with invalid credentials', () => {
  assert.equal(bddContext.response?.status, 200);
  assert.deepEqual(bddContext.response?.body, {
    auth: false,
    message: messageResponse.INVALID_CREDENTIALS,
  });
});

Then('access should be denied', () => {
  assert.equal(bddContext.response?.status, 401);
  assert.deepEqual(bddContext.response?.body, {
    auth: false,
    message: 'No token provided.',
  });
});