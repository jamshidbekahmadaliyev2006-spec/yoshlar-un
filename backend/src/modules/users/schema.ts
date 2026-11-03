import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const getUsersSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
  })
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    status: z.nativeEnum(UserStatus)
  })
});

