// routes/documents.routes.ts

import { Router } from 'express';
import {createBlocks, getBlocks, getBlock, updateBlock, deleteBlock, getTotalBlockNumber} from '../controllers/blocks.controller';
import { adminAuth, authenticate } from '../middlewares/authMiddleware'; // Import the authenticate middleware

const router = Router();

// Create a new document
router.post("/create", adminAuth, createBlocks);
router.get('/',authenticate, getBlocks);
router.get('/:id',authenticate, getBlock);
router.get('/count/blocks',authenticate, getTotalBlockNumber);
router.put('/:id',adminAuth, updateBlock);
router.delete('/:id',adminAuth, deleteBlock);

export default router;
