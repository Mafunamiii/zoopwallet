import {model, Schema} from "mongoose";


export type TAccount = {
    userID: string;
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
    userID: {
        type: String,
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