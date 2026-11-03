import { Router } from 'express';
import { SettingsController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { requireRoles } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { updateSettingsSchema, updatePasswordSchema } from './schema';

const router = Router();

router.get('/', SettingsController.getSettings);
router.put('/', authMiddleware, requireRoles('ADMIN'), validate(updateSettingsSchema), SettingsController.updateSettings);
router.put('/password', authMiddleware, requireRoles('ADMIN'), validate(updatePasswordSchema), SettingsController.updatePassword);

export default router;

