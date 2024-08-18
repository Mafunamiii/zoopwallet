import express from 'express';
import { UserService } from '../services';
import { UserController } from '../controller';
import dotenv from "dotenv";
import path from "node:path";
import {loggerCreate} from "../utils";
import {authenticateJWT, errorHandler} from "../middleware";

dotenv.config();
const logger = loggerCreate('user-service-routes');


const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
logger.info(`JWT_SECRET: ${JWT_SECRET}`);
const userRouter = express.Router();
const userService = new UserService();
const userController = new UserController(userService, JWT_SECRET);


userRouter.post('/Uregister', (req, res, next) =>
    userController.createUser(req, res, next)
);
userRouter.post('/login', (req, res, next) =>
    userController.login(req, res, next)
);

userRouter.get('/:id', authenticateJWT, (req, res, next) =>
    userController.getUserById(req, res, next)
);
userRouter.get('/', authenticateJWT, (req, res, next) =>
    userController.getAllUsers(req, res, next)
);
userRouter.put('/:id', authenticateJWT, (req, res, next) =>
    userController.updateUser(req, res, next)
);
userRouter.delete('/:id', authenticateJWT, (req, res, next) =>
    userController.deleteUser(req, res, next)
);
userRouter.post('/logout', authenticateJWT, (req, res, next) =>
    userController.logout(req, res, next)
);

userRouter.use(errorHandler)
export { userRouter };