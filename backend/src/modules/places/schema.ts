import { z } from 'zod';

export const getPlacesSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    mahallaId: z.string().optional(),
    q: z.string().optional()
  })
});

