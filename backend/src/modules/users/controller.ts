import { Request, Response, NextFunction } from 'express';
import { UsersService } from './service';
import { successResponse, errorResponse } from '../../utils/response';
import { UserStatus } from '@prisma/client';

export class UsersController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, role, status, page, limit } = req.query;
      const data = await UsersService.getUsers({
        q: q ? String(q) : undefined,
        role: role ? String(role) : undefined,
        status: status ? String(status) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10
      });
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UsersService.getUserStats();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const data = await UsersService.updateStatus(id, status as UserStatus);
      return successResponse(res, data, 'Status yangilandi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await UsersService.exportCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      return res.status(200).send(csv);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

