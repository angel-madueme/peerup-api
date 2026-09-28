import { z } from 'zod';
import { paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

export const subjectIdParamsSchema = z.object({ id: publicIdSchema });
export const subjectListQuerySchema = z.object({
  ...paginationShape,
  sort: z.literal('name').default('name'),
  category: z.string().trim().min(1).optional(),
});
