import { z } from 'zod';
import { defaultedSort, paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

export const subjectIdParamsSchema = z.object({ id: publicIdSchema });
export const subjectListQuerySchema = z.object({
  ...paginationShape,
  sort: defaultedSort(['name'] as const, 'name'),
  category: z.string().trim().min(1).optional(),
});
