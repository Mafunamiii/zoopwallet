// wallet-service.ts

import StripeService from './Stripe.service'; // Correct import
import { UserModel } from '../model';
import {loggerCreate} from "../utils";

const logger = loggerCreate('account-service');

export class AccountService {
    private stripeService: typeof StripeService;

    constructor() {
        this.stripeService = StripeService;
    }

    async createWallet(userId: string, email: string): Promise<{ success: boolean, wallet: any }> {
        const user = await UserModel.findById(userId);
        logger.info('Creating wallet for user', { user });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.wallet?.stripeCustomerId) {
            throw new Error('Wallet already exists for this user', );
        }

        const customer = await this.stripeService.createCustomer(email);
        user.wallet = { balance: 0, stripeCustomerId: customer.id };
        await user.save();

        return { success: true, wallet: user.wallet };
    }
}