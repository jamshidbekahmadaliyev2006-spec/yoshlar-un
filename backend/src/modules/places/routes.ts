import { Router } from 'express';
import { PlacesController } from './controller';
import { validate } from '../../middleware/validate';
import { getPlacesSchema } from './schema';

const router = Router();

router.get('/', validate(getPlacesSchema), PlacesController.getPlaces);
router.get('/:id', PlacesController.getPlaceById);

export default router;

