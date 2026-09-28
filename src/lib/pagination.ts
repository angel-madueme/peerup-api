import { z } from 'zod';
import { config } from '../config/index.js';

export const paginationShape = {
  limit: z.coerce.number().int().min(1).default(config.defaultLimit).transform((value) => Math.min(value, config.maxLimit)),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.enum(['asc', 'desc']).default('asc'),
};

export const listMeta = (total: number, limit: number, offset: number) => ({
  total,
  limit,
  offset,
  hasMore: offset + limit < total,
});
