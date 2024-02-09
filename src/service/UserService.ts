
import {Request, Response} from 'express';
import {pbkdf2Sync, randomBytes, scrypt} from 'crypto';
import { UserPort } from '../repository/interface/UserPort.js';
import { User } from '../repository/UserDTO.js';
import { RequestLoginUser } from './usercontract.js';
import JsonWebTokenError from 'jsonwebtoken';
import { messageResponse } from '../enum/messageResponse.js';

export class UserService {

  constructor(private readonly repository:UserPort) {
  }

  async registerUser(user:User) {
      const salt = this.gerarSalt();
      const userCreated = await this.repository.create({
        email: user.email,
        name: user.name,
        senha: this.gerarHash(user.senha, salt),
        salt
      })
      return userCreated;
  }

  async loginUser(userLogin: RequestLoginUser) {
    try {
          const user = await this.repository.getUserByEmail(userLogin.email);
          if (!user) {
            return {auth: false, message: messageResponse.NOT_FOUND_EMAIL}
          }
          const isValid = this.validPassword(userLogin.senha, user.salt || '', user.senha)
          if (isValid) {
            const jwtHash = JsonWebTokenError.sign({name: user.name, email: user.email}, String(process.env.JWT_SECRET), {
              expiresIn: 900
            });

            return {auth: true, message:messageResponse.SUCESS_AUTH, token: jwtHash}
          }

          return {auth: false, message:messageResponse.PASSWORD_AUTH_FAILED}
    } catch (error) {
      return {auth: false, message:messageResponse.FAILED_AUTH, error:error}
    }
 
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