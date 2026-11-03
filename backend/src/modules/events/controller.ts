import { Request, Response, NextFunction } from 'express';
import { EventsService } from './service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class EventsController {
  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, category, date, limit } = req.query;
      const data = await EventsService.getEvents({
        q: q ? String(q) : undefined,
        category: category ? String(category) : undefined,
        date: date ? String(date) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined
      });
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EventsService.getEventById(id);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 404);
    }
  }

  static async createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await EventsService.createEvent({
        ...req.body,
        userId
      });
      return successResponse(res, data, 'Tadbir muvaffaqiyatli yaratildi', 201);
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EventsService.updateEvent(id, req.body);
      return successResponse(res, data, 'Tadbir yangilandi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EventsService.deleteEvent(id);
      return successResponse(res, data, 'Tadbir o‘chirildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }
}

