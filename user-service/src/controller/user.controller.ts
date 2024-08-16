import { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema } from '../middleware';
import { UserService } from '../services';
import { loggerCreate } from "../index";
import { UserStatus } from "../enum";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const logger = loggerCreate('user-service-controller');

export class UserController {
    _userService: UserService;
    _jwtSecret?: string;

    constructor(userService: UserService) {
        this._userService = userService;
    }

    setJwtSecret(jwtSecret: string) {
        this._jwtSecret = jwtSecret;
    }

    private ensureJwtSecret() {
        if (!this._jwtSecret) {
            throw new Error('JWT secret is not set');
        }
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        logger.info("Received request to create a user");

        // Validate request body
        const validationResult = createUserSchema.safeParse(req.body);
        logger.info("Validating request body");

        if (!validationResult.success) {
            logger.warn("Validation failed", { errors: validationResult.error.errors });
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        const userData = validationResult.data;

        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: hashedPassword,
                role: UserStatus.ACTIVE
            };

            logger.info("Creating user", { user });

            // Create user
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

    async login(req: Request, res: Response, next: NextFunction) {
        logger.info("Received login request");

        const { email, password } = req.body;

        try {
            const user = await this._userService.getUserByEmail(email);

            if (!user) {
                logger.warn("User not found", { email });
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                logger.warn("Invalid password", { email });
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (user.status !== UserStatus.ACTIVE) {
                logger.warn("User account is inactive", { email });
                return res.status(403).json({ message: 'Account is inactive' });
            }

            if (!this._jwtSecret) {
                logger.error("JWT secret is not defined");
                return res.status(500).json({ message: 'Internal server error' });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role }, // Ensure userId is a string
                this._jwtSecret,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            logger.info("Login successful, JWT generated", { email });

            return res.status(200).json({ message: 'Login successful', token });
        } catch (error: any) {
            logger.error("Error during login", { error });
            return res.status(500).json({ message: 'Error during login', error: error.message });
        }
    }

}
