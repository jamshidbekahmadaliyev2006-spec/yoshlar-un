import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { errorResponse } from '../utils/response';

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Autentifikatsiya qilinmagan', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Ushbu amalni bajarish uchun sizda ruxsat yo‘q', 403);
    }

    next();
  };
}

