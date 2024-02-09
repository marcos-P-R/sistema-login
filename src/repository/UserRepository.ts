import { ResponseUser, User } from "./UserDTO.js";
import { UserPort } from "./interface/UserPort.js";
import { prisma } from "./prismaClient.js";

export class UserRepository implements UserPort {

  async create(user: User): Promise<ResponseUser> {
    const data = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        senha: user.senha,
        salt: user.salt
      }
    });

    return {
      id: data.id,
      name: data.name,
      email: data.email
    };
  }

  async getUserByEmail(email:string): Promise<User | null> {
    const data = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    return data;
  }
}