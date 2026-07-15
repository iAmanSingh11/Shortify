import { z } from 'zod';
import { ALIAS_REGEX } from '../utils/shortCode.js';

const urlString = z
  .string()
  .trim()
  .min(1, 'URL is required')
  .max(2048, 'URL is too long')
  .refine((val) => {
    try {
      const parsed = new URL(val);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Must be a valid http/https URL');

export const createUrlSchema = z.object({
  body: z.object({
    originalUrl: urlString,
    customAlias: z
      .string()
      .trim()
      .regex(ALIAS_REGEX, 'Alias must be 3-30 chars: letters, numbers, - or _')
      .optional()
      .or(z.literal('')),
    title: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
    password: z.string().min(4).max(64).optional().or(z.literal('')),
    expiresAt: z.string().datetime().optional().or(z.literal('')),
  }),
});

export const updateUrlSchema = z.object({
  body: z.object({
    originalUrl: urlString.optional(),
    title: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
    password: z.string().min(4).max(64).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const verifyPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
  params: z.object({
    shortCode: z.string().min(1),
  }),
});
