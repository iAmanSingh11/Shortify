import { z } from 'zod';

export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    scopes: z.array(z.enum(['urls:read', 'urls:write', 'analytics:read'])).min(1).optional(),
    expiresInDays: z.number().int().positive().max(365).optional(),
  }),
});
