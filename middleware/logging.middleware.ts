import logger from '../utils/logger';
import {Response, Request, NextFunction} from "express";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip
  });
  next();
};

module.exports = requestLogger;