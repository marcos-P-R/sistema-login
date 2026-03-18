import { randomUUID } from 'node:crypto';

export function makeUserPayload(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return {
    name: 'Usuario Teste',
    email: `user-${randomUUID()}@example.com`,
    password: 'senha-segura-123',
    ...overrides,
  };
}