import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    tuman: z.string().optional(),
    sys: z.string().optional(),
    email: z.string().email('Email formati noto‘g‘ri').optional(),
    tel: z.string().optional(),
    notifications: z.array(z.number()).optional()
  })
});

export const updatePasswordSchema = z.object({
  body: z.object({
    login: z.string().min(1, 'Login kiritilishi shart'),
    oldPassword: z.string().min(1, 'Eski parol kiritilishi shart'),
    newPassword: z.string().min(8, 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak')
  })
});

