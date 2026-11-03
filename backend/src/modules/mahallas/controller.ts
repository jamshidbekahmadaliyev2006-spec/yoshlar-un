import { Request, Response, NextFunction } from 'express';
import { MahallasService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class MahallasController {
  static async getMahallas(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MahallasService.getMahallas();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getMahallaById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await MahallasService.getMahallaById(id);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 404);
    }
  }

  static async getMahallaStats(req: Request, res: Response, next: NextFunction) {
    try {
      const sortBy = (req.query.sortBy as 'r' | 'k' | 'avg') || 'r';
      const data = await MahallasService.getMahallaStats(sortBy);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

