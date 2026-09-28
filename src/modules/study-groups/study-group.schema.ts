import { z } from 'zod';
import { paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

const booleanQuery = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean());

export const studyGroupIdParamsSchema = z.object({ id: publicIdSchema });
export const studyGroupListQuerySchema = z.object({
  ...paginationShape,
  sort: z.enum(['name', 'createdAt']).default('createdAt'),
  subjectId: publicIdSchema.optional(),
  hasSpace: booleanQuery.optional(),
});
export const studyGroupSessionQuerySchema = z.object({
  ...paginationShape,
  sort: z.literal('startTime').default('startTime'),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  when: z.enum(['upcoming', 'past']).optional(),
  studentId: publicIdSchema.optional(),
});
