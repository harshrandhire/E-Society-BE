import { Request, Response, NextFunction } from 'express';
import path from 'path';

export const checkFileType = (req: Request, res: Response, next: NextFunction): void => {
  
  const allowedFileTypes = ['.pdf', '.jpeg', '.jpg', '.png', '.gif'];

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  } else {
    const extname = path.extname(req.file.originalname).toLowerCase();

    if (!allowedFileTypes.includes(extname)) {
      res.status(400).json({ error: 'Invalid file type. Only PDF and image files are allowed.' });
    } else {
      next(); // Continue to the next middleware or route handler
    }
  }
};
