// User.repository.ts
import { Model } from 'mongoose';
import { IUserRepository } from './User.repository.interface';

import { UserModel, TUser } from '../model'; // Adjust the path as needed

export class UserRepository implements IUserRepository {
    constructor(private userModel: Model<TUser>) {}

    async createUser(user: TUser): Promise<TUser> {
        const newUser = new this.userModel(user);
        return newUser.save();
    }

    async getUserById(id: string): Promise<TUser | null> {
        return this.userModel.findById(id).exec();
    }

    async updateUser(id: string, user: Partial<TUser>): Promise<TUser | null> {
        return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
    }

    async deleteUser(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }
}
