import { Router } from 'express';
import { AIController } from './controller';

const router = Router();

// POST /api/v1/ai/chat
router.post('/chat', AIController.chat);

export default router;

