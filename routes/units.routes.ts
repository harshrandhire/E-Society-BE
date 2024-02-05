import { Router } from 'express';
import {createUnits, getUnits, getUnit, deleteUnit, getUnassignedTenants, unAssignUnit, getAvailableUnits, updateUnits, assignUnit,multipledeleteUnits} from '../controllers/units.controller';
import { adminAuth, authenticate, managerAuth } from '../middlewares/authMiddleware'; // Import the authenticate middleware

const router = Router();

// Create a new document
router.post("/create", adminAuth, createUnits);
router.get('/',authenticate, getUnits);
router.get('/:id',authenticate, getUnit);
router.put('/:id',managerAuth, assignUnit);
router.put('/:id',adminAuth, updateUnits);
router.put('/unAssign/:id',managerAuth, unAssignUnit);
router.delete('/multipleDlelete', authenticate, multipledeleteUnits);
router.delete('/:id',adminAuth, deleteUnit);
router.get('/unAssign/get-tenant',managerAuth, getUnassignedTenants);
router.get('/available/units',authenticate, getAvailableUnits);

export default router;
