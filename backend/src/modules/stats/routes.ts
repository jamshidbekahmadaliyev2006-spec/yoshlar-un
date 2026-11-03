import { Router } from 'express';
import { StatsController } from './controller';

const router = Router();

router.get('/overview', StatsController.getOverview);
router.get('/weekly', StatsController.getWeekly);
router.get('/categories', StatsController.getCategories);

export default router;

