import express, { Request, Response } from 'express';
import {UserService} from "../services/User.service";
import {UserRepository} from "../repository";
import {UserModel} from "../model";

const router = express.Router()
const userRepository = new UserRepository(UserModel);
const userService = new UserService(userRepository);



router.post('/create', async (req: Request, res: Response) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error : any) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

router.get('/getAll', async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error : any) {
        console.error('Error getting all users:', error);
        res.status(500).json({ message: 'Error getting all users', error: error.message });
    }
});


