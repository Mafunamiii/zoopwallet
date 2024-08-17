import { UserModel, TUser, UserInput } from '../model';
import { UserStatus } from '../enum';
import {loggerCreate} from "../";

const logger = loggerCreate('user-service-service');

export class UserService {
    constructor() {}


    async createUser(userInput: UserInput): Promise<TUser> {
        logger.info("Creating user", { userInput });

        const newUser = new UserModel({
            ...userInput,
            status: UserStatus.ACTIVE,
            role: "user"
        });

        logger.info("Saving user to database", { user: newUser });
        const savedUser = await newUser.save();
        return savedUser;
    }

    async logoutUser(userId: string): Promise<TUser | null> {
        logger.info("Logging out user", { userId });

        try {
            const updatedUser = await UserModel.findByIdAndUpdate(userId, { status: UserStatus.INACTIVE }, { new: true });

            if (!updatedUser) {
                logger.warn("User not found for logout", { userId });
                throw new Error('User not found'); // Or return null, depending on your error handling strategy
            }

            logger.info("User logged out successfully", { userId });
            return updatedUser;
        } catch (error) {
            logger.error("Error logging out user", { userId, error });
            throw error; // Re-throw the error to be handled in the controller
        }
    }

    async getUserById(id: string): Promise<TUser | null> {
        return await UserModel.findById(id);
    }

    async getUserByEmail(email: string): Promise<TUser | null> {
        return await UserModel.findOne({ email });
    }

    async updateUser(id: string, updateData: Partial<UserInput>): Promise<TUser | null> {
        return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deleteUser(id: string): Promise<TUser | null> {
        return await UserModel.findByIdAndDelete(id);
    }

    async getAllUsers(): Promise<TUser[]> {
        return await UserModel.find();
    }

    async changeUserStatus(id: string, status: UserStatus): Promise<TUser | null> {
        return await UserModel.findByIdAndUpdate(id, { status }, { new: true });
    }
}