import { Request, Response, NextFunction } from 'express';
import { RegistrationsService } from './service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class RegistrationsController {
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const eventId = parseInt(req.params.id, 10);
      const data = await RegistrationsService.register(userId, eventId);
      return successResponse(res, data, 'Ro‘yxatdan o‘tildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async unregister(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const eventId = parseInt(req.params.id, 10);
      const data = await RegistrationsService.unregister(userId, eventId);
      return successResponse(res, data, 'Bekor qilindi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrToken } = req.body;
      const data = await RegistrationsService.checkIn(qrToken);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async getMyRegistrations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await RegistrationsService.getUserRegistrations(userId);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

