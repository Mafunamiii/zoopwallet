import {z} from 'zod';

export const validateUserCreation = z.object({
    firstName: z.string().min(2).max(255),
    lastName: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(20, 'Password must be at most 20 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/\d/, 'Password must contain at least one digit')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
}).required();

export const validateUserLogin = z.object({
    email: z.string().email(),
}).required();

export const validateUserUpdate = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.string().optional(),
});

export const validateWalletCreation = z.object({
    userId: z.string(),
    email: z.string().email(),
}).required();