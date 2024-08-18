import express from 'express';
import { UserService } from '../services';
import { UserController } from '../controller';
import { loggerCreate, authenticateJWT } from "../index";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const logger = loggerCreate('user-service-routes');


const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
logger.info(`JWT_SECRET: ${JWT_SECRET}`);
const userRouter = express.Router();
const userService = new UserService();
const userController = new UserController(userService, JWT_SECRET);


// Unprotected routes (no middleware)
userRouter.post('/Uregister', (req, res, next) => userController.createUser(req, res, next));
userRouter.post('/login', (req, res, next) => userController.login(req, res, next));

// Protected routes (require authentication)
userRouter.get('/:id', authenticateJWT, (req, res, next) => userController.getUserById(req, res, next));
userRouter.get('/', authenticateJWT, (req, res, next) => userController.getAllUsers(req, res, next));
userRouter.put('/:id', authenticateJWT, (req, res, next) => userController.updateUser(req, res, next));
userRouter.delete('/:id', authenticateJWT, (req, res, next) => userController.deleteUser(req, res, next));
userRouter.post('/logout', authenticateJWT, (req, res, next) => userController.logout(req, res, next));

export { userRouter };