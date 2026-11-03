import { z } from 'zod';

export const uploadResponseSchema = z.object({
  url: z.string()
});

