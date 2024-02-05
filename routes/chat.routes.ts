import { Router } from 'express';
import { sendMessage } from '../controllers/chat.controller';

const router = Router();

router.post('/send-message', sendMessage); // Use the sendMessage function from the chatController

export default router;
