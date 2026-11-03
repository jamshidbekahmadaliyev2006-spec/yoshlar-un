import { Request, Response, NextFunction } from 'express';
import { successResponse, errorResponse } from '../../utils/response';

export class UploadsController {
  static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Fayl tanlanmagan', 400);
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return successResponse(res, {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }, 'Fayl yuklandi');
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

