// middleware/documentValidationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import {  validationResult } from 'express-validator';

// Export a function that can be used as middleware
export function validateCreateDocumentMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Run validation and check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }