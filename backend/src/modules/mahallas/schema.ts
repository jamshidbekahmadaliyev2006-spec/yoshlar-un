import { z } from 'zod';

export const getMahallaStatsSchema = z.object({
  query: z.object({
    sortBy: z.enum(['c', 'p', 'k']).optional()
  })
});

