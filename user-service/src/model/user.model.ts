import { Schema, model, Document } from 'mongoose';
import { UserStatus } from '../enum';

export type TUser = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    status: UserStatus;
}

export type UserInput = Omit<TUser, 'role' | 'createdAt' | 'updatedAt' | 'status'>;

const userSchema = new Schema<TUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.ACTIVE
    }
}, {timestamps: true, collection: 'user'});


export const UserModel = model<TUser>('User', userSchema);