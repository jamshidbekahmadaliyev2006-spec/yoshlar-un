import { Router } from 'express';
import { EventsController } from './controller';
import { validate } from '../../middleware/validate';
import { getEventsSchema, createEventSchema } from './schema';
import { authMiddleware } from '../../middleware/auth';
import { requireRoles } from '../../middleware/role';

const router = Router();

router.get('/', validate(getEventsSchema), EventsController.getEvents);
router.get('/:id', EventsController.getEventById);

router.post('/', authMiddleware, requireRoles('ADMIN', 'COACH'), validate(createEventSchema), EventsController.createEvent);
router.put('/:id', authMiddleware, requireRoles('ADMIN'), EventsController.updateEvent);
router.delete('/:id', authMiddleware, requireRoles('ADMIN'), EventsController.deleteEvent);

export default router;

