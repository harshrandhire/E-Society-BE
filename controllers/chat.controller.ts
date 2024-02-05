import { Request, Response } from 'express';
import { Models } from '../models';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { ticketId, sender, receiver, message } = req.body;
    const models: Models = req.app.locals.models;
    const io = req.app.locals.io; // Access the initialized Socket.IO instance

    // Create a new message associated with the ticket and user, with the status set to 'sent'
    const newMessage = await models.chatModel.create({
      ticketId,
      sender,
      receiver,
      message,
      status: 'sent',
    });

    // Emit a 'messagePosted' event to notify clients
    if (io) {
      io.to(ticketId).emit('messagePosted', newMessage);
    } else {
      console.error('Socket.io server is not properly initialized');
    }

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

