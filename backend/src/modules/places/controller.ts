import { Request, Response, NextFunction } from 'express';
import { PlacesService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class PlacesController {
  static async getPlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, mahallaId, q } = req.query;
      const data = await PlacesService.getPlaces({
        category: category ? String(category) : undefined,
        mahallaId: mahallaId ? parseInt(String(mahallaId), 10) : undefined,
        q: q ? String(q) : undefined
      });
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getPlaceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await PlacesService.getPlaceById(id);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 404);
    }
  }
}

