// user.routes.ts

import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, login, forgotPassword, resetPassword, changePassword, signup, createByManager, createByAdmin, assignPropertyToManager, updateByManager, createByManagerMultiple } from '../controllers/users.controller';
import { authenticate, adminAuth, managerAuth,  } from '../middlewares/authMiddleware'; // Import the authenticate middleware
import { validateChangePassword, createUserValidationRules,loginValidationRules, updateUserValidationRules, forgotPasswordValidation, singhUpValidationRules, createUserValidationRulesMultipleUser } from '../validators/userValidator'

const router = Router();

router.get('/',authenticate, getUsers);
router.get('/:id',authenticate, getUser);
router.get('/managerlist/:id',authenticate, assignPropertyToManager);
router.post('/admin-create', adminAuth, createUserValidationRules, createByAdmin);
router.post('/manager-create', managerAuth, createUserValidationRules, createByManager);
router.post('/manager-create-multiple', managerAuth,  createUserValidationRulesMultipleUser,  createByManagerMultiple);
router.post('/login', loginValidationRules, login);
router.post('/signup',singhUpValidationRules, signup);
router.put('/:id', authenticate,updateUserValidationRules, updateUser); // Protect the route with authenticate middleware
router.put('/managerupdate/:id', managerAuth, updateByManager); // Protect the route with authenticate middleware
router.delete('/:id', authenticate, deleteUser); // Protect the route with authenticate middleware
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', authenticate, validateChangePassword, changePassword);


export default router;