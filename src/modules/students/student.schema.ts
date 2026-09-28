import { z } from 'zod';
import { paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

const booleanQuery = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean());

export const studentIdParamsSchema = z.object({ id: publicIdSchema });
export const studentListQuerySchema = z.object({
  ...paginationShape,
  sort: z.enum(['name', 'createdAt']).default('createdAt'),
  isTutor: booleanQuery.optional(),
  subjectId: publicIdSchema.optional(),
});
