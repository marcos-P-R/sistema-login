
import { pbkdf2Sync, randomBytes } from 'crypto';
import { UserPort } from '../repository/interface/UserPort.js';
import { User } from '../repository/UserDTO.js';
import { RequestLoginUser } from './usercontract.js';
import jwt from 'jsonwebtoken';
import { messageResponse } from '../enum/messageResponse.js';
import { AppError } from '../errors/AppError.js';

export class UserService {

  constructor(private readonly repository:UserPort) {
  }

  async registerUser(user:User) {
      this.validateRegistration(user);

      const normalizedEmail = user.email.trim().toLowerCase();
      const existingUser = await this.repository.getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new AppError(409, messageResponse.EMAIL_ALREADY_EXISTS);
      }

      const salt = this.gerarSalt();
      const userCreated = await this.repository.create({
        email: normalizedEmail,
        name: user.name.trim(),
        senha: this.gerarHash(user.senha, salt),
        salt
      })
      return userCreated;
  }

  async loginUser(userLogin: RequestLoginUser) {
    this.validateLogin(userLogin);

    try {
          const user = await this.repository.getUserByEmail(userLogin.email.trim().toLowerCase());
          if (!user) {
            return {auth: false, message: messageResponse.INVALID_CREDENTIALS}
          }
          const isValid = this.validPassword(userLogin.senha, user.salt || '', user.senha)
          if (isValid) {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
              throw new AppError(500, messageResponse.INTERNAL_ERROR);
            }

            const jwtHash = jwt.sign({name: user.name, email: user.email}, secret, {
              expiresIn: 900
            });

            return {auth: true, message:messageResponse.SUCESS_AUTH, token: jwtHash}
          }

          return {auth: false, message:messageResponse.INVALID_CREDENTIALS}
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return {auth: false, message:messageResponse.FAILED_AUTH}
    }
 
  }

  private validateRegistration(user: User) {
    const isInvalidName = typeof user.name !== 'string' || user.name.trim().length < 2;
    const isInvalidEmail = typeof user.email !== 'string' || !this.isValidEmail(user.email);
    const isInvalidPassword = typeof user.senha !== 'string' || user.senha.trim().length < 6;

    if (isInvalidName || isInvalidEmail || isInvalidPassword) {
      throw new AppError(400, messageResponse.INVALID_REGISTRATION_DATA);
    }
  }

  private validateLogin(userLogin: RequestLoginUser) {
    const hasInvalidEmail = typeof userLogin.email !== 'string' || !this.isValidEmail(userLogin.email);
    const hasInvalidPassword = typeof userLogin.senha !== 'string' || userLogin.senha.trim().length === 0;

    if (hasInvalidEmail || hasInvalidPassword) {
      throw new AppError(400, messageResponse.INVALID_AUTH_DATA);
    }
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private gerarHash(senha: string, salt: string) {
    return pbkdf2Sync(senha, salt, 1000, 64, `sha512`).toString(`hex`);
  }

  private gerarSalt() {
    return randomBytes(16).toString('hex');
  }

  private validPassword (senha: string, salt: string, hashDb: string) { 
    const hash = pbkdf2Sync(senha, salt, 1000, 64, `sha512`).toString(`hex`); 
    return hashDb === hash; 
  }; 
}