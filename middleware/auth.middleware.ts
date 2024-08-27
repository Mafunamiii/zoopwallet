import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import logger from '../utils/logger';
import config from '../config';
import { Request, Response, NextFunction } from 'express';

export const authenticateJWT = async (req: Request, res: Response, next : NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string }; // Type assertion for clarity
    logger.info('Decoded token:', decoded);
    const userId = decoded.id;
    const user = await User.findById(userId).select('-password');
    logger.info('found user:', user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.body.user = user;
    next();
  } catch (error : any) {
    logger.error('Authentication error:', error);
    if (error.name == 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error == 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const authenticateAdmin = async (req: Request, res: Response, next : NextFunction) => {
  authenticateJWT(req, res, () => {
    if (req.body.user && req.body.user.role === "admin") {
      next();
    } else {
      res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }
  });
};

export default { authenticateJWT, authenticateAdmin };

