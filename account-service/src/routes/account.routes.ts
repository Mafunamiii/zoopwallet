import dotenv from "dotenv";
import {loggerCreate} from "../utils";
import express from "express";
import {AccountService} from "../services";
import {AccountController} from "../controller";
import {authenticateJWT} from "../middleware";


dotenv.config();
const logger = loggerCreate('account-service-routes');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
logger.info(`JWT_SECRET: ${JWT_SECRET}`);

const accountRouter = express.Router();
const accountService = new AccountService();
const accountController = new AccountController(accountService, JWT_SECRET);

accountRouter.post('/createWallet', authenticateJWT, (req, res, next) =>
    accountController.createWallet(req, res, next)
);
export { accountRouter };