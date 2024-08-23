import {NextFunction, Response, Request} from "express";

const createValidationMiddleware = (validationFunction: (arg0: any) => { error: any; }) => {
    return (req : Request, res: Response, next: NextFunction) => {
      const { error } = validationFunction(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      next();
    };
  };

module.exports = createValidationMiddleware;
