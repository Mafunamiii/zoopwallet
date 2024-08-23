import logger from '../utils/logger';

const errorHandler = (err: { stack: any; name: string; errors: { [s: string]: unknown; } | ArrayLike<unknown>; code: number; keyValue: {}; status: any; message: any; type: string; }, req: any, res: {
  status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: any; }): void; new(): any; }; };
}, next: any) => {
  logger.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error);
    return res.status(400).json({ error: errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${field} already exists.` });
  }

  // JWT authentication error
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Custom application errors
  if (err.name === 'ApplicationError') {
    return res.status(err.status || 400).json({ error: err });
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    return res.status(400).json({ error: err.message });
  }

  // Default to 500 server error
  res.status(500).json({ error: 'Internal Server Error' });
};


export default errorHandler;
