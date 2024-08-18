import {loggerCreate} from "../utils";
import { Request, Response, NextFunction } from 'express';


const logger = loggerCreate('shared-error-middleware');

export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        logger.error(err.stack);

        // Handle Mongoose errors
        if (err.name === 'ValidationError') {
            const errors = Object.values((err as any).errors).map((error: any) => error.message);
            return res.status(400).json({ error: errors });
        }
        if ((err as { code?: number }).code === 11000) {
            const field = Object.keys((err as any).keyValue)[0];
            return res.status(400).json({ error: `${field} already exists.` });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        // Authentication/Authorization errors
        if (err.name === 'UnauthorizedError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (err.name === 'ForbiddenError') {
            return res.status(403).json({ error: 'Access denied' });
        }


    } else {
        logger.error('An unknown error occurred:', err);
    }

    res.status(500).json({ error: 'Internal Server Error' });
};

