"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_service_1 = require("../services/User.service");
const repository_1 = require("../repository");
const model_1 = require("../model");
const router = express_1.default.Router();
const userRepository = new repository_1.UserRepository(model_1.UserModel);
const userService = new User_service_1.UserService(userRepository);
router.post('/create', async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});
router.get('/getAll', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ message: 'Error getting all users', error: error.message });
    }
});
