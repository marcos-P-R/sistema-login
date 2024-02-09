import {Request, Response, NextFunction} from "express";
import jwt from 'jsonwebtoken';
import { messageResponse } from "../enum/messageResponse.js";

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, String(process.env.JWT_SECRET), function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: messageResponse.FAILED_TOKEN});
      
      next();
    });
  }