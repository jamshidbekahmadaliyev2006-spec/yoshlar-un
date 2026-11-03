import { Router } from 'express';
import { UsersController } from './controller';
import { validate } from '../../middleware/validate';
import { getUsersSchema, updateUserStatusSchema } from './schema';
import { authMiddleware } from '../../middleware/auth';
import { requireRoles } from '../../middleware/role';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(getUsersSchema), UsersController.getUsers);
router.get('/stats', UsersController.getUserStats);
router.get('/export', requireRoles('ADMIN'), UsersController.exportCsv);
router.patch('/:id/status', requireRoles('ADMIN'), validate(updateUserStatusSchema), UsersController.updateStatus);

export default router;

