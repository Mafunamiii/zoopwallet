import {model, Schema} from "mongoose";
import {TUser} from "./user.model";

export type TAccount = {
    user: TUser;
    balance: number;
    currency: string;
    stripeCustomerId: string;
}

export type customerCreateData = {
    userId: string;
    email: string;
    balance: number;
}

const accountSchema = new Schema<TAccount>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: { type:
        Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'PHP',
        required: true
    },
    stripeCustomerId: {
        type: String,
        required: true
    },
}, {timestamps: true, collection: 'account'});

export const AccountModel = model<TAccount>('Account', accountSchema);