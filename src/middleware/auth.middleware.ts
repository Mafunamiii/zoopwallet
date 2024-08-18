import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {UserModel} from "../model";
import {loggerCreate} from "../utils";
import dotenv from "dotenv";
import * as path from "node:path";

const logger = loggerCreate('shared-auth-middleware');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DecodedToken extends JwtPayload {
    id: string;
}

export interface AuthenticatedRequest extends Request {
    user?: any;  // You may replace `any` with the actual user type if available
}

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    logger.info('Authenticating user');
    logger.info(`JWT_SECRET: ${process.env.JWT_SECRET}`);

    try {
        const authHeader = req.header('Authorization');
        logger.info(`authHeader: ${authHeader}`);

        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        logger.info(`token: ${token}`);

        if (!token) {
            return res.status(401).json({ error: 'Access denied. Invalid token format.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
        logger.info(`decoded: ${JSON.stringify(decoded)}`);

        try {
            const user = await UserModel.findById(decoded.userId).select('-password');
            logger.info(`user: ${user}`);

            if (!user) {
                return res.status(401).json({ error: 'Invalid token. User not found.' });
            }

            req.user = user;
            next(); // Call next() only if authentication is successful
        } catch (dbError) {
            logger.error('Database error during user lookup:', dbError);
            return res.status(500).json({ error: 'Internal server error' });
        }

    } catch (error: any) {
        logger.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired.' });
        }

        res.status(500).json({ error: 'Internal server error.'
        });
    }
};

export default authenticateJWT;
