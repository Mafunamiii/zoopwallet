import { UserModel, TUser, UserInput } from '../model';
import { UserStatus } from '../enum';
import { v4 as uuidv4 } from 'uuid';
import {loggerCreate} from "../";

const logger = loggerCreate('user-service-service');

export class UserService {
    constructor() {}

    async createUser(userInput: UserInput): Promise<TUser> {
        logger.info("Creating user", { userInput });
        const newUser = new UserModel(userInput);
        newUser.status = UserStatus.ACTIVE;
        newUser.role = "user";
        logger.info("Saving user to database", { user: newUser });
        const savedUser = await newUser.save();
        return savedUser;
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