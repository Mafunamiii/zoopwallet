import {z} from 'zod';

export const createUserSchema = z.object({
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
});