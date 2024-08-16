import { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema } from '../middleware'; // Assume you have updateUserSchema for validation
import { UserService } from '../services';
import { loggerCreate } from "../index";
import { UserStatus } from "../enum";

const logger = loggerCreate('user-service-controller');

export class UserController {

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

    async getUserById(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        logger.info(`Received request to get user by ID: ${userId}`);

        try {
            const user = await this._userService.getUserById(userId);
            if (!user) {
                logger.warn(`User with ID ${userId} not found`);
                return res.status(404).json({ message: 'User not found' });
            }

            logger.info(`User with ID ${userId} retrieved successfully`, { user });
            return res.status(200).json({message: 'User retrieved succesfully:', user: user });
        } catch (error: any) {
            logger.error(`Error retrieving user with ID ${userId}`, { error });
            return res.status(500).json({ message: 'Error retrieving user', error: error.message });
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        logger.info(`Received request to update user by ID: ${userId}`);
        const validationResult = updateUserSchema.safeParse(req.body);
        logger.info("Validating request body");

        if (!validationResult.success) {
            logger.warn("Validation failed", { errors: validationResult.error.errors });
            return res.status(400).json({ errors: validationResult.error.errors });
        }
        const updateData = validationResult.data;

        try {
            const updatedUser = await this._userService.updateUser(userId, updateData);
            if (!updatedUser) {
                logger.warn(`User with ID ${userId} not found`);
                return res.status(404).json({ message: 'User not found' });
            }

            logger.info(`User with ID ${userId} updated successfully`, { user: updatedUser });
            return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
        } catch (error: any) {
            logger.error(`Error updating user with ID ${userId}`, { error });
            return res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        logger.info(`Received request to delete user by ID: ${userId}`);

        try {
            const deletedUser = await this._userService.deleteUser(userId);
            if (!deletedUser) {
                logger.warn(`User with ID ${userId} not found`);
                return res.status(404).json({ message: 'User not found' });
            }

            logger.info(`User with ID ${userId} deleted successfully`);
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (error: any) {
            logger.error(`Error deleting user with ID ${userId}`, { error });
            return res.status(500).json({ message: 'Error deleting user', error: error.message });
        }
    }

    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        logger.info("Received request to get all users");

        try {
            const users = await this._userService.getAllUsers();
            logger.info(`Retrieved ${users.length} users successfully`);
            return res.status(200).json({ users });
        } catch (error: any) {
            logger.error("Error retrieving users", { error });
            return res.status(500).json({ message: 'Error retrieving users', error: error.message });
        }
    }
}
