import { Schema, model, Document, Types  } from 'mongoose';
import { UserStatus } from '../enum';
import bcrypt from "bcryptjs";

export type TUser = {
    id?: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    status: UserStatus;
    wallet?: IWallet;
}

export interface IWallet {
    balance: number;
    stripeCustomerId: string;
}

export type UserInput = Omit<TUser, 'role' | 'createdAt' | 'updatedAt' | 'status' | 'wallet'>;

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
    },
    wallet: {
        balance: { type: Number, default: 0, min: 0 },
        stripeCustomerId: { type: String},
    }
}, {timestamps: true, collection: 'user'});

export async function checkPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

export const UserModel = model<TUser>('User', userSchema);