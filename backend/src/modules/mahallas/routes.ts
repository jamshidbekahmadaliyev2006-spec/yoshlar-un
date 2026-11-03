import { Router } from 'express';
import { MahallasController } from './controller';
import { validate } from '../../middleware/validate';
import { getMahallaStatsSchema } from './schema';

const router = Router();

router.get('/', MahallasController.getMahallas);
router.get('/stats', validate(getMahallaStatsSchema), MahallasController.getMahallaStats);
router.get('/:id', MahallasController.getMahallaById);

export default router;

