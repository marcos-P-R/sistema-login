import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { messageResponse } from '../../src/enum/messageResponse.js';
import { UserService } from '../../src/service/UserService.js';
import type { UserPort } from '../../src/repository/interface/UserPort.js';

function createRepositoryMock(): UserPort {
  return {
    create: vi.fn(),
    getUserByEmail: vi.fn(),
  };
}

describe('UserService', () => {
  it('registers user with hash and salt when payload is valid', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.getUserByEmail).mockResolvedValue(null);
    vi.mocked(repository.create).mockImplementation(async (user) => ({
      id: 1,
      name: user.name,
      email: user.email,
    }));

    const service = new UserService(repository);
    const result = await service.registerUser({
      name: 'Maria',
      email: 'Maria@Example.com',
      senha: 'strong-password',
    });

    expect(result).toEqual({ id: 1, name: 'Maria', email: 'maria@example.com' });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria',
        email: 'maria@example.com',
        salt: expect.any(String),
        senha: expect.any(String),
      }),
    );
  });

  it('rejects registration with invalid payload', async () => {
    const service = new UserService(createRepositoryMock());

    await expect(
      service.registerUser({
        name: 'A',
        email: 'invalid-email',
        senha: '123',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: messageResponse.INVALID_REGISTRATION_DATA,
    });
  });

  it('rejects registration when email already exists', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.getUserByEmail).mockResolvedValue({
      name: 'Maria',
      email: 'maria@example.com',
      senha: 'hash',
      salt: 'salt',
    });

    const service = new UserService(repository);

    await expect(
      service.registerUser({
        name: 'Maria',
        email: 'maria@example.com',
        senha: 'strong-password',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: messageResponse.EMAIL_ALREADY_EXISTS,
    });
  });

  it('returns token when login uses hash persisted by service', async () => {
    process.env.JWT_SECRET = 'unit-secret';

    const registerRepository = createRepositoryMock();
    vi.mocked(registerRepository.getUserByEmail).mockResolvedValue(null);
    vi.mocked(registerRepository.create).mockImplementation(async (user) => ({
      id: 1,
      name: user.name,
      email: user.email,
    }));

    const registerService = new UserService(registerRepository);
    await registerService.registerUser({
      name: 'Joao',
      email: 'joao@example.com',
      senha: 'secure-password',
    });

    const persistedUser = vi.mocked(registerRepository.create).mock.calls[0][0];
    const loginRepository = createRepositoryMock();
    vi.mocked(loginRepository.getUserByEmail).mockResolvedValue({
      name: 'Joao',
      email: 'joao@example.com',
      senha: persistedUser.senha,
      salt: persistedUser.salt,
    });

    const loginService = new UserService(loginRepository);
    const result = await loginService.loginUser({
      email: 'joao@example.com',
      senha: 'secure-password',
    });

    expect(result.auth).toBe(true);
    expect(result.message).toBe(messageResponse.SUCESS_AUTH);
    expect(result.token).toEqual(expect.any(String));
    expect(jwt.verify(result.token as string, process.env.JWT_SECRET as string)).toMatchObject({
      email: 'joao@example.com',
      name: 'Joao',
    });
  });

  it('returns expected error when password is incorrect', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.getUserByEmail).mockResolvedValue({
      name: 'Maria',
      email: 'maria@example.com',
      senha: 'invalid-hash',
      salt: 'salt',
    });

    const service = new UserService(repository);
    const result = await service.loginUser({
      email: 'maria@example.com',
      senha: 'wrong-password',
    });

    expect(result).toEqual({ auth: false, message: messageResponse.INVALID_CREDENTIALS });
  });

  it('rejects login with missing or invalid payload', async () => {
    const service = new UserService(createRepositoryMock());

    await expect(
      service.loginUser({
        email: 'invalid-email',
        senha: '',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: messageResponse.INVALID_AUTH_DATA,
    });
  });
});