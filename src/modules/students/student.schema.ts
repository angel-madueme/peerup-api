import { z } from 'zod';
import { defaultedSort, paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

const booleanQuery = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean());

export const studentIdParamsSchema = z.object({ id: publicIdSchema });
export const studentListQuerySchema = z.object({
  ...paginationShape,
  sort: defaultedSort(['name', 'createdAt'] as const, 'createdAt'),
  isTutor: booleanQuery.optional(),
  subjectId: publicIdSchema.optional(),
});
