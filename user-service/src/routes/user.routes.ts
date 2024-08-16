import express from 'express';
import { UserService } from "../services";
import { UserController } from "../controller";
import { loggerCreate } from "../index";

const userRouter = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const logger = loggerCreate('user-service-routes');

// Bind the method to ensure 'this' context is maintained
userRouter.post('/', (req, res, next) => userController.createUser(req, res, next));
userRouter.get('/:id', (req, res, next) => userController.getUserById(req, res, next));
userRouter.get('/', (req, res, next) => userController.getAllUsers(req, res, next));
userRouter.put('/:id', (req, res, next) => userController.updateUser(req, res, next));
userRouter.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export { userRouter };
