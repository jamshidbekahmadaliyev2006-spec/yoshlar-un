import { Router } from 'express';
import { AppealsController } from './controller';

const router = Router();

// GET /api/v1/appeals - Barcha murojaatlar
router.get('/', AppealsController.getAll);

// GET /api/v1/appeals/stats - Statistika
router.get('/stats', AppealsController.getStats);

// GET /api/v1/appeals/:id - Bitta murojaat
router.get('/:id', AppealsController.getById);

// POST /api/v1/appeals - Mobil ilovadan yangi murojaat yuborish
router.post('/', AppealsController.create);

// POST /api/v1/appeals/:id/reply - Admin javob qaytarishi
router.post('/:id/reply', AppealsController.reply);

// DELETE /api/v1/appeals/:id - Murojaatni o'chirish
router.delete('/:id', AppealsController.delete);

export default router;

