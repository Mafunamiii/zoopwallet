import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { UserStatus } from '../enum';

export type TUser = {
    _id: Schema.Types.UUID;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    status: UserStatus;
}

export type UserInput = Omit<TUser, '_id' | 'createdAt' | 'updatedAt'>;

const userSchema = new Schema<TUser>({
    _id: { type: Schema.Types.UUID, default: uuidv4, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.ACTIVE
    }
});
export const UserModel = model<TUser>('User', userSchema);