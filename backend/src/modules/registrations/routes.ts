import { Router } from 'express';
import { RegistrationsController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { checkInSchema } from './schema';

const router = Router();

router.post('/check-in', validate(checkInSchema), RegistrationsController.checkIn);
router.get('/my', authMiddleware, RegistrationsController.getMyRegistrations);
router.post('/events/:id/register', authMiddleware, RegistrationsController.register);
router.delete('/events/:id/register', authMiddleware, RegistrationsController.unregister);

export default router;

