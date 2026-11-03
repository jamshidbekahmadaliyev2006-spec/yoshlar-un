import { Request, Response, NextFunction } from 'express';
import { StatsService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class StatsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StatsService.getOverview();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getWeekly(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StatsService.getWeekly();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StatsService.getCategories();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

