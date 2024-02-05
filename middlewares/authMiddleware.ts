/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
// authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import appConfig from '../common/appConfig';

// Extend the Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }
  // Check if the token starts with "Bearer"
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  // Extract the token without "Bearer"
  const token = authHeader.substring(7);

  try {
    // Verify the token
    const decoded = jwt.verify(token, appConfig.jwtSecretKey);

    // Attach the decoded user object to the request for use in protected routes
    req.user = decoded;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, appConfig.jwtSecretKey) as { role: string };
    
    if (decoded && decoded.role === 'Admin') {
      // User is an admin, proceed to the next middleware or route handler
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const managerAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, appConfig.jwtSecretKey) as { role: string };
    
    if (decoded && decoded.role === 'Manager') {
      // User is an admin, proceed to the next middleware or route handler
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. manager privileges required' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const tenantAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, appConfig.jwtSecretKey) as { role: string };

    if (decoded && decoded.role === 'Tenant') {
      // User is a tenant, proceed to the next middleware or route handler
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Tenant privileges required' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); // Set the destination folder for uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix); // Set the filename for the uploaded file
  }
});

export const upload = multer({ storage: storage });

