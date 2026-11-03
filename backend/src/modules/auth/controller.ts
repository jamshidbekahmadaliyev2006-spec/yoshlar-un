import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const data = await AuthService.login(username, password);
      return successResponse(res, data, 'Tizimga muvaffaqiyatli kirildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const data = await AuthService.sendOtp(phone);
      return successResponse(res, data, 'Tasdiqlash kodi yuborildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = req.body;
      const data = await AuthService.verifyOtp(phone, code);
      return successResponse(res, data, 'Tasdiqlandi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AuthService.getMe(userId);
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 404);
    }
  }
}

