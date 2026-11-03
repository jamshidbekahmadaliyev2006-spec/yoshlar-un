import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(`Xatolik: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Serverda ichki xatolik yuz berdi';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
}

