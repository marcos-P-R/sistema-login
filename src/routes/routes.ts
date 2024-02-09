import Express from 'express';
import cors from "cors";
import { rateLimiterUsingThirdParty } from "../middleware/rateLimiter.js";
import { verifyJWT } from "../middleware/validJWT.js";
import { createUser, login, ping } from '../controllers/UserController.js';

const app = Express();

app.use(rateLimiterUsingThirdParty)
app.use(Express.json());
app.use(cors());

app.post('/user', createUser);

app.post('/login', login);

app.get('/ping', verifyJWT, ping)

export {app}