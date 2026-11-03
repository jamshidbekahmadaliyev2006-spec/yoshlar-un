import { z } from 'zod';
import { EventCategory } from '@prisma/client';

export const getEventsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    limit: z.string().optional()
  })
});

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Tadbir nomi kamida 3 ta belgi bo‘lishi kerak'),
    category: z.nativeEnum(EventCategory),
    placeId: z.number().int().positive('Lokatsiya tanlanishi shart'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana formati: YYYY-MM-DD'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Vaqt formati: HH:mm'),
    ageRange: z.string().optional().default('15–25 yosh'),
    capacity: z.number().optional().default(100),
    description: z.string().min(5, 'Tadbir tavsifi kamida 5 ta belgi bo‘lishi kerak'),
    imageUrl: z.string().optional()
  })
});

