
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { DocumentInterface } from '../models/documents.model';
import { Models } from '../models';

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { document_name, description, userId, uploadedBy } = req.body;

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = path.join(__dirname, '../assets/documents', file.filename);

    // Read the uploaded file and save it using fs
    fs.readFile(file.path, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      fs.writeFile(filePath, data, async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        // Construct the full URL of the uploaded file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fullUrl = `${baseUrl}/assets/documents/${file.filename}`;

        // Create a new document record in the database
        const documentData: Partial<DocumentInterface> = {
          document_name,
          description,
          filePath,
          userId,
          uploadedBy,
          fileUrl: fullUrl, // Store the full URL in the database
        };

        // Get the Sequelize models instance from app.locals
        const models: Models = req.app.locals.models;

        // Create a new document using the Document model
        const newDocument = await models.document.create(documentData);

        return res.status(201).json({ document: newDocument });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    // Get the Sequelize models instance from app.locals
    const models: Models = req.app.locals.models;

    // Fetch all documents from the database
    const documents = await models.document.findAll();

    return res.status(200).json({ documents });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get the Sequelize models instance from app.locals
    const models: Models = req.app.locals.models;

    // Find the document by ID in the database
    const document = await models.document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    return res.status(200).json({ document });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { document_name, description, userId, uploadedBy } = req.body;

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = path.join(__dirname, '../assets/documents', file.filename);

    // Read the uploaded file and save it using fs
    fs.readFile(file.path, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      fs.writeFile(filePath, data, async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        // Construct the full URL of the uploaded file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fullUrl = `${baseUrl}/assets/documents/${file.filename}`;

        // Get the Sequelize models instance from app.locals
        const models: Models = req.app.locals.models;

        // Find the document by ID in the database
        const document = await models.document.findByPk(id);

        if (!document) {
          return res.status(404).json({ message: 'Document not found' });
        }

        // Update document properties
        document.set({
          document_name,
          description,
          filePath,
          userId,
          uploadedBy,
          fileUrl: fullUrl, // Update the full URL in the database
        });

        // Save the updated document to the database
        await document.save();

        return res.status(200).json({ document });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get the Sequelize models instance from app.locals
    const models: Models = req.app.locals.models;

    // Find the document by ID in the database
    const document = await models.document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete the document from the database
    await document.destroy();

    // Send a "delete successfully" response
    return res.status(204).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const Services = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument
};

export default Services;
