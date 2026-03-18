import { startTestEnvironment, stopTestEnvironment } from '../shared/testEnvironment.js';

export default async function globalSetup() {
  await startTestEnvironment();

  return async () => {
    await stopTestEnvironment();
  };
}