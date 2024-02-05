// routes/property.routes.ts

import { Router } from 'express';
import {createProperty, getProperties, getProperty, updateProperty, deleteProperty, getAvailableProperty, getTotalPropertyNumber, getCountsForManager, getCountsForAdminTable, getCountsForManagerTable} from '../controllers/properties.controller';
import { adminAuth, authenticate,} from '../middlewares/authMiddleware'; // Import the authenticate middleware

const router = Router();

// Create a new document
router.post("/create", adminAuth, createProperty);
router.get('/',authenticate, getProperties);
router.get('/:id',authenticate, getProperty);
router.put('/:id',adminAuth, updateProperty);
router.delete('/:id',adminAuth, deleteProperty);
router.get('/available/property',authenticate, getAvailableProperty);
router.get('/count/property',authenticate, getTotalPropertyNumber);
router.get('/countManager/property',authenticate, getCountsForManager);
router.get('/countAdminTable/property',authenticate, getCountsForAdminTable);
router.get('/countManagerTable/property',authenticate, getCountsForManagerTable);

export default router;