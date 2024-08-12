import { Request, Response, NextFunction } from 'express';
import { createUserSchema } from '../middleware';
import { UserService } from '../services';
import {UserInput} from "../model";
import {loggerCreate} from "../index";
import {UserStatus} from "../enum"; // Import your service
const logger = loggerCreate('user-service-controller');

export class UserController{

    _userService;

    constructor(userService: UserService) {
        this._userService = userService;
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        logger.info("Received request to create a user");
        const validationResult = createUserSchema.safeParse(req.body);
        logger.info("Validating request body");

        if (!validationResult.success) {
            logger.warn("Validation failed", { errors: validationResult.error.errors });
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        // Extract validated data
        const userData = validationResult.data;

        const user = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            role: UserStatus.ACTIVE
        }
        try {
            logger.info("Creating user", { user });
            const createdUser = await this._userService.createUser(user);
            logger.info("User created successfully", { user: createdUser });

            return res.status(201).json({ message: 'User created successfully', user: createdUser });
        } catch (error: any) {

            logger.error("Error creating user", { error });
            return res.status(500).json({ message: 'Error creating user', error: error.message });
        }

    }
}



