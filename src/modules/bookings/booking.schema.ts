import { z } from 'zod';
import { defaultedSort, paginationShape } from '../../lib/pagination.js';
import { publicIdSchema } from '../../lib/public.js';

export const bookingIdParamsSchema = z.object({ id: publicIdSchema });
export const bookingListQuerySchema = z.object({
  ...paginationShape,
  sort: defaultedSort(['createdAt', 'sessionStartTime'] as const, 'createdAt'),
  studentId: publicIdSchema.optional(),
  status: z.enum(['confirmed', 'cancelled']).optional(),
  when: z.enum(['upcoming', 'past']).optional(),
});
export const createBookingBodySchema = z.object({
  studentId: publicIdSchema,
  sessionId: publicIdSchema,
});
export const cancelBookingBodySchema = z.object({
  status: z.literal('cancelled'),
});
