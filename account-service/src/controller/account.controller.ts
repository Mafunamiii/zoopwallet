import { Request, Response, NextFunction } from 'express';
import {AccountService} from "../services";
import {loggerCreate} from "../../src";
import {AuthenticatedRequest} from "../../src";
import {customerCreateData} from "../model";
import {validateWalletCreation} from "../utils/validator.util";

const logger = loggerCreate('account-service-controller');

export class AccountController {
    _jwtSecret: string;
    _accountService: AccountService;

    constructor(accountService: AccountService, jwtSecret: string) {
        this._accountService = accountService;
        this._jwtSecret = jwtSecret;
    }

    async createWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        logger.info("Received request to create a wallet", { user: req.user });

        try {

            const validationResult = validateWalletCreation.safeParse({
                userId: req.user.id?.toString() || '',
                email: req.user.email
            });
            logger.info("Validation result", { validationResult });

            if (!validationResult.success) {
                logger.warn("Validation failed", { errors: validationResult.error.errors });
                return res.status(400).json({ errors: validationResult.error.errors });
            }

            const { userId, email } = validationResult.data;
            const { success, wallet } = await this._accountService.createWallet(userId, email);

            if (!success) {
                return res.status(400).json({ message: 'Failed to create wallet' });
            }

            logger.info("Wallet created successfully", { wallet });
            return res.status(201).json({ message: 'Wallet created successfully', wallet });
        } catch (error: any) {
            logger.error("Error creating wallet", { error });
            return res.status(500).json({ message: 'Error creating wallet', error: error.message });
        }
    }

}