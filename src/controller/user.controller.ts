import { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema, AuthenticatedRequest } from '../middleware';
import { UserService } from '../services';
import { UserStatus } from "../enum";
import jwt from 'jsonwebtoken';
import {checkPassword} from "../model";
import {loggerCreate} from "../utils";

const logger = loggerCreate('user-service-controller');

export class UserController {
    _userService: UserService;
    _jwtSecret: string;

    constructor(userService: UserService, jwtSecret: string) {
        this._userService = userService;
        this._jwtSecret = jwtSecret;
        logger.info('User controller initialized with JWT secret:', { jwtSecret });
    }

    private ensureJwtSecret() {
        logger.info('Ensuring JWT secret is set');
        if (!this._jwtSecret) {
            throw new Error('JWT secret is not set');
        }
        logger.info('JWT secret is set');
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        logger.info("Received request to create a user");

        const validationResult = createUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger.warn("Validation failed", { errors: validationResult.error.errors });
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        const userData = validationResult.data;

        try {
            const createdUser = await this._userService.createUser(userData);

            logger.info("User created successfully", { user: createdUser });
            return res.status(201).json({ message: 'User created successfully', user: createdUser });
        } catch (error: any) {
            logger.error("Error creating user", { error });
            return res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        logger.info("Received login request");

        const { email, password } = req.body;

        try {
            const user = await this._userService.getUserByEmail(email);

            if (!user) {
                logger.warn("User not found", { email });
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isPasswordValid = await checkPassword(password, user.password);

            if (!isPasswordValid) {
                logger.warn("Invalid password", { email });
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (user.id) {
                try {
                    await this._userService.changeUserStatus(user.id.toString(), UserStatus.ACTIVE);
                    logger.info("User status updated to ACTIVE", { email });
                } catch (error: any) {
                    logger.error("Error updating user status", { error });
                    return res.status(500).json({ message: 'Error during login', error: error });
                }
            } else {
                logger.error("User ID is missing");
                return res.status(400).json({ message: 'User ID is required' });
            }

            this.ensureJwtSecret();

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
                this._jwtSecret!,
                { expiresIn: '1h' }
            );

            logger.info("Login successful, JWT generated", { email });

            return res.status(200).json({ message: 'Login successful', token });
        } catch (error: any) {
            logger.error("Error during login", error);
            return res.status(500).json({ message: 'Error during login', error: error });
        }
    }

    async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        logger.info("Received logout request");
        logger.info("JWT_SECRET: ", { jwtSecret: this._jwtSecret });
        try {
            const userId = req.user._id;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' }); // Early return if unauthorized
            }

            await this._userService.logoutUser(userId);
            logger.info("Before sending logout success response");

            // Send response and exit function immediately
            res.status(200).json({ message: 'Logout successful' });
            return;  // Exit function to prevent further execution
        } catch (error: any) {
            logger.error("Error during logout", { error });
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Error during logout', error: error.message });
            }
        }
    }



    async getUserById(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;

        try {
            const user = await this._userService.getUserById(userId);
            logger.info(`Retrieved user with ID ${userId} successfully`, { user });
            if (!user) {
                logger.warn(`User with ID ${userId} not found`);
                return res.status(404).json({ message: 'User not found' });
            }

            logger.info(`User with ID ${userId} retrieved successfully`, { user });
            return res.status(200).json({ message: 'User retrieved successfully', user: user });
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
