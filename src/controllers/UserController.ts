import {Request, Response} from "express";
import { UserService } from "../service/UserService.js";
import { UserRepository } from "../repository/UserRepository.js";


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
    res.status(500).json(JSON.stringify({error}))
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
    res.status(500).json(JSON.stringify({error}))
  }

}

const ping = (req: Request, res: Response) => {
  res.json({msg:'pong'})
}

export {createUser, login, ping}