// routes/documents.routes.ts

import { Router } from 'express';
import multer from 'multer';
import {createDocument,getAllDocuments,getDocumentById,updateDocument,deleteDocument} from '../controllers/documents.controller';
import { checkFileType } from '../middlewares/fileUploadMiddleware';
import { authenticate } from '../middlewares/authMiddleware'; // Import the authenticate middleware
import { validateCreateDocumentMiddleware } from '../validators/documentValidator';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Create a new document
router.post('/create',authenticate, upload.single('file'),checkFileType,validateCreateDocumentMiddleware,(req, res) => {createDocument(req, res);});

// // Get all documents
router.get('/getAll',authenticate, getAllDocuments);

// // Get a single document by ID
router.get('/:id',authenticate, getDocumentById);

// // Update a document by ID
router.put('/:id', upload.single('file'),checkFileType, validateCreateDocumentMiddleware,(req, res) => {updateDocument(req, res);});

// // Delete a document by ID
router.delete('/:id',deleteDocument);

export default router;
