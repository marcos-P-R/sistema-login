import type { Express } from 'express';
import type { Response } from 'supertest';
import { AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { getTestApp, resetDatabase, stopTestEnvironment } from '../../shared/testEnvironment.js';

setDefaultTimeout(120000);

export const bddContext: {
  app: Express | null;
  response: Response | null;
  payload: { name?: string; email?: string; password?: string } | null;
} = {
  app: null,
  response: null,
  payload: null,
};

BeforeAll(async () => {
  bddContext.app = await getTestApp();
});

Before(async () => {
  await resetDatabase();
  bddContext.response = null;
  bddContext.payload = null;
});

AfterAll(async () => {
  await stopTestEnvironment();
});