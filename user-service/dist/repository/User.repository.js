"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
class UserRepository {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async createUser(user) {
        const newUser = new this.userModel(user);
        return newUser.save();
    }
    async getUserById(id) {
        return this.userModel.findById(id).exec();
    }
    async updateUser(id, user) {
        return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
    }
    async deleteUser(id) {
        await this.userModel.findByIdAndDelete(id).exec();
    }
}
exports.UserRepository = UserRepository;
