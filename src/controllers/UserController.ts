import {Request, Response} from "express";
import { UserService } from "../service/UserService.js";
import { UserRepository } from "../repository/UserRepository.js";
import { AppError } from "../errors/AppError.js";
import { messageResponse } from "../enum/messageResponse.js";


const createUser = async (req: Request, res: Response) => {
  const {name, email, password} = req.body;
  try {
    const userController = new UserService(new UserRepository);
    const userCreated = await userController.registerUser({
      name,
      email,
      senha: password
    });
    res.status(201).json(userCreated)
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: messageResponse.INTERNAL_ERROR })
  }

}

const login = async (req: Request, res: Response) => {
  const {email, password} = req.body;
  try {
    const userController = new UserService(new UserRepository);
    const login = await userController.loginUser({
      email,
      senha: password
    });
    res.status(200).json(login)
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ auth: false, message: error.message });
    }

    return res.status(500).json({ auth: false, message: messageResponse.INTERNAL_ERROR })
  }

}

const ping = (req: Request, res: Response) => {
  res.json({msg:'pong'})
}

export {createUser, login, ping}