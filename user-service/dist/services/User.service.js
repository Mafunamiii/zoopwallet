"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const model_1 = require("../model");
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async createUser(userInput) {
        const newUser = new model_1.UserModel(userInput);
        return await newUser.save();
    }
    async getUserById(id) {
        return await model_1.UserModel.findById(id);
    }
    async getUserByEmail(email) {
        return await model_1.UserModel.findOne({ email });
    }
    async updateUser(id, updateData) {
        return await model_1.UserModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    async deleteUser(id) {
        return await model_1.UserModel.findByIdAndDelete(id);
    }
    async getAllUsers() {
        return await model_1.UserModel.find();
    }
    async changeUserStatus(id, status) {
        return await model_1.UserModel.findByIdAndUpdate(id, { status }, { new: true });
    }
}
exports.UserService = UserService;
