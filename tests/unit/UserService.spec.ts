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
  it('cadastra usuário com hash e salt quando os dados são válidos', async () => {
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
      senha: 'senha-forte',
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

  it('rejeita cadastro com dados inválidos', async () => {
    const service = new UserService(createRepositoryMock());

    await expect(
      service.registerUser({
        name: 'A',
        email: 'email-invalido',
        senha: '123',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: messageResponse.INVALID_REGISTRATION_DATA,
    });
  });

  it('rejeita cadastro com email já existente', async () => {
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
        senha: 'senha-forte',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: messageResponse.EMAIL_ALREADY_EXISTS,
    });
  });

  it('retorna token quando login usa hash persistido pelo serviço', async () => {
    process.env.JWT_SECRET = 'segredo-unitario';

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
      senha: 'senha-segura',
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
      senha: 'senha-segura',
    });

    expect(result.auth).toBe(true);
    expect(result.message).toBe(messageResponse.SUCESS_AUTH);
    expect(result.token).toEqual(expect.any(String));
    expect(jwt.verify(result.token as string, process.env.JWT_SECRET as string)).toMatchObject({
      email: 'joao@example.com',
      name: 'Joao',
    });
  });

  it('retorna erro esperado quando a senha está incorreta', async () => {
    const repository = createRepositoryMock();
    vi.mocked(repository.getUserByEmail).mockResolvedValue({
      name: 'Maria',
      email: 'maria@example.com',
      senha: 'hash-invalido',
      salt: 'salt',
    });

    const service = new UserService(repository);
    const result = await service.loginUser({
      email: 'maria@example.com',
      senha: 'senha-errada',
    });

    expect(result).toEqual({ auth: false, message: messageResponse.INVALID_CREDENTIALS });
  });

  it('rejeita login com payload ausente ou inválido', async () => {
    const service = new UserService(createRepositoryMock());

    await expect(
      service.loginUser({
        email: 'email-invalido',
        senha: '',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: messageResponse.INVALID_AUTH_DATA,
    });
  });
});