import { UserModel, TUser, UserInput } from '../model';
import { UserStatus } from '../enum';
import {IUserRepository} from "../repository";

export class UserService {
    constructor(private userRepository: IUserRepository) {
    }

    async createUser(userInput: UserInput): Promise<TUser> {
        const newUser = new UserModel(userInput);
        return await newUser.save();
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