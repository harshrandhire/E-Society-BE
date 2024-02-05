// middlewares/models.ts

import { Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import initializeModels, { Models } from '../models'; // Import your models

export const attachModelsToRequest = (sequelize: Sequelize) => {
  const models: Models = initializeModels(sequelize);
  return (req: Request, res: Response, next: NextFunction) => {
    req.app.locals.models = models;
    next();
  };
};
