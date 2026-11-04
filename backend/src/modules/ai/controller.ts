import { Request, Response, NextFunction } from 'express';
import { AIService } from './service';
import { successResponse, errorResponse } from '../../utils/response';

export class AIController {
  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt, history } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return errorResponse(res, 'Prompt kiritilishi shart', 400);
      }

      const conversationHistory = Array.isArray(history) ? history : [];
      const result = await AIService.processChat(prompt, conversationHistory);

      return successResponse(res, result);
    } catch (err: any) {
      return errorResponse(res, err.message || 'AI xizmatida xatolik yuz berdi', 500);
    }
  }
}

