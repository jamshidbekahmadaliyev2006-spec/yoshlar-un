import { Request, Response } from 'express';
import { appealsService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class AppealsController {
  static getAll(req: Request, res: Response) {
    try {
      const { status, category, q } = req.query;
      const data = appealsService.getAll({
        status: status ? String(status) : undefined,
        category: category ? String(category) : undefined,
        query: q ? String(q) : undefined
      });
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static getStats(req: Request, res: Response) {
    try {
      const stats = appealsService.getStats();
      return successResponse(res, stats);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const appeal = appealsService.getById(id);
      if (!appeal) {
        return errorResponse(res, 'Murojaat topilmadi', 404);
      }
      return successResponse(res, appeal);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static create(req: Request, res: Response) {
    try {
      const { userName, phone, mahalla, category, subject, text } = req.body;
      if (!userName || !phone || !subject || !text) {
        return errorResponse(res, 'Iltimos, ism, telefon raqam, mavzu va matnni to‘liq kiriting', 400);
      }
      const created = appealsService.create({
        userName,
        phone,
        mahalla: mahalla || 'Yunusobod tumani',
        category: category || 'IT va zamonaviy ta’lim',
        subject,
        text
      });
      return successResponse(res, created, 'Murojaatingiz muvaffaqiyatli qabul qilindi!', 201);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static reply(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { replyText, repliedBy } = req.body;
      if (!replyText || !replyText.trim()) {
        return errorResponse(res, 'Iltimos, javob matnini kiriting', 400);
      }
      const updated = appealsService.reply(id, replyText, repliedBy || 'Admin (Yunusobod Yoshlar bo‘limi)');
      if (!updated) {
        return errorResponse(res, 'Murojaat topilmadi', 404);
      }
      return successResponse(res, updated, 'Javob muvaffaqiyatli yuborildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = appealsService.delete(id);
      if (!deleted) {
        return errorResponse(res, 'Murojaat topilmadi', 404);
      }
      return successResponse(res, null, 'Murojaat o‘chirildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

