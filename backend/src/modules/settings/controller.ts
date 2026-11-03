import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SettingsService.getSettings();
      return successResponse(res, data);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SettingsService.updateSettings(req.body);
      return successResponse(res, data, 'Sozlamalar saqlandi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { login, oldPassword, newPassword } = req.body;
      const data = await SettingsService.updatePassword(login, oldPassword, newPassword);
      return successResponse(res, data, 'Parol o‘zgartirildi');
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }
}

