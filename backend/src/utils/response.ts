import { Response } from 'express';

export function successResponse(res: Response, data: any = null, message = 'Muvaffaqiyatli', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function errorResponse(res: Response, message = 'Xatolik yuz berdi', statusCode = 400, errors: any = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

