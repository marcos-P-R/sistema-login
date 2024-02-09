import { ResponseUser, User } from "../UserDTO.js";

export interface UserPort {
  create(user:User): Promise<ResponseUser>;
  getUserByEmail(email: string): Promise<User | null>;
}