import { Request, Response, NextFunction } from 'express';
import { loggerCreate } from '../index'; // Adjust the path according to your project structure

const logger = loggerCreate('user-service-request-logger');

export const requestLogger = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        logger.info(`Received ${req.method} request for ${req.url}`);
        logger.debug(`Request Headers: ${JSON.stringify(req.headers)}`);
        logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
        next();
    };
};