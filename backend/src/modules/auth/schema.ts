import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Login yoki telefon kiritilishi shart'),
    password: z.string().min(4, 'Parol kamida 4 ta belgi bo‘lishi kerak')
  })
});

export const otpSendSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+?[0-9\s-]{9,20}$/, 'Telefon raqam formati noto‘g‘ri')
  })
});

export const otpVerifySchema = z.object({
  body: z.object({
    phone: z.string().min(9, 'Telefon raqami kiritilishi shart'),
    code: z.string().length(6, 'Tasdiqlash kodi 6 ta raqamdan iborat')
  })
});

