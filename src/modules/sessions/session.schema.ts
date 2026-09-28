import { z } from 'zod';
import { defaultedSort, paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

export const sessionIdParamsSchema = z.object({ id: publicIdSchema });
export const sessionListQuerySchema = z.object({
  ...paginationShape,
  sort: defaultedSort(['startTime'] as const, 'startTime'),
  studyGroupId: publicIdSchema.optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  when: z.enum(['upcoming', 'past']).optional(),
});
