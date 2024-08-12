import express from 'express';
import { UserService } from "../services";
import { UserController } from "../controller";
import { loggerCreate } from "../index";

const userRouter = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const logger = loggerCreate('user-service-routes');

// Bind the method to ensure 'this' context is maintained
userRouter.post('/create', (req, res, next) => userController.createUser(req, res, next));


export { userRouter };
