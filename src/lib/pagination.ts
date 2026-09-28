import { z } from 'zod';
import { config } from '../config/index.js';

const missingQueryValue = (value: unknown) => value === undefined || value === '' ? undefined : value;

const defaultedNumber = (fallback: number, minimum: number) => z.preprocess(
  missingQueryValue,
  z.coerce.number().finite().int().min(minimum).default(fallback),
);

export const defaultedSort = <const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => z.preprocess(
  missingQueryValue,
  z.enum(values).default(fallback),
);

export const paginationShape = {
  limit: defaultedNumber(config.defaultLimit, 1).transform((value) => Math.min(value, config.maxLimit)),
  offset: defaultedNumber(0, 0),
  order: defaultedSort(['asc', 'desc'] as const, 'asc'),
};

export const listMeta = (total: number, limit: number, offset: number) => ({
  total,
  limit,
  offset,
  hasMore: offset + limit < total,
});
