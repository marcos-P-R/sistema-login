import { randomUUID } from 'node:crypto';

export function makeUserPayload(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return {
    name: 'Test User',
    email: `user-${randomUUID()}@example.com`,
    password: 'secure-password-123',
    ...overrides,
  };
}