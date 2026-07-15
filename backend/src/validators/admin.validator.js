import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  body: z.object({ role: z.enum(['user', 'admin']) }),
  params: z.object({ id: z.string().min(1) }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
  params: z.object({ id: z.string().min(1) }),
});
