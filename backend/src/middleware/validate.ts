import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return errorResponse(res, 'Validatsiya xatosi', 422, issues);
      }
      return errorResponse(res, 'Kiritilgan ma’lumotlar noto‘g‘ri', 400);
    }
  };
}

