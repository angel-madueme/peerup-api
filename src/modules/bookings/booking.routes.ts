import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { ApiError, notFound } from '../../lib/errors.js';
import { makePublicId } from '../../lib/public.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { bookingIdParamsSchema, bookingListQuerySchema, cancelBookingBodySchema, createBookingBodySchema } from './booking.schema.js';

const router = Router();
const bookingInclude = {
  session: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      locationOrLink: true,
      status: true,
      studyGroup: {
        select: {
          id: true,
          name: true,
          maxMembers: true,
          subject: { select: { id: true, name: true, category: true } },
          _count: { select: { members: true } },
        },
      },
    },
  },
} as const;

const toBooking = (booking: any) => ({
  id: booking.id,
  studentId: booking.studentId,
  sessionId: booking.sessionId,
  status: booking.status,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  session: {
    id: booking.session.id,
    startTime: booking.session.startTime,
    endTime: booking.session.endTime,
    locationOrLink: booking.session.locationOrLink,
    status: booking.session.status,
  },
  studyGroup: {
    id: booking.session.studyGroup.id,
    name: booking.session.studyGroup.name,
    memberCount: booking.session.studyGroup._count.members,
    maxMembers: booking.session.studyGroup.maxMembers,
  },
  subject: booking.session.studyGroup.subject,
});

const timeWhere = (when?: 'upcoming' | 'past') => {
  if (!when) return {};
  return { session: { startTime: when === 'upcoming' ? { gte: new Date() } : { lt: new Date() } } };
};

const bookingWhere = (studentId?: string, status?: 'confirmed' | 'cancelled', when?: 'upcoming' | 'past') => ({
  ...(studentId ? { studentId } : {}),
  ...(status ? { status } : {}),
  ...timeWhere(when),
});

router.get('/', validateQuery(bookingListQuerySchema), async (request, response, next) => {
  try {
    const { limit, offset, sort, order, studentId, status, when } = request.query as unknown as ReturnType<typeof bookingListQuerySchema.parse>;
    const where = bookingWhere(studentId, status, when);
    const orderBy = sort === 'sessionStartTime' ? { session: { startTime: order } } : { createdAt: order };
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ where, include: bookingInclude, orderBy, skip: offset, take: limit }),
      prisma.booking.count({ where }),
    ]);
    response.json({ data: bookings.map(toBooking), meta: listMeta(total, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createBookingBodySchema), async (request, response, next) => {
  const { studentId, sessionId } = request.body as ReturnType<typeof createBookingBodySchema.parse>;
  try {
    const booking = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Session" WHERE "id" = ${sessionId} FOR UPDATE`;
      const [student, session] = await Promise.all([
        tx.student.findUnique({ where: { id: studentId }, select: { id: true } }),
        tx.session.findUnique({
          where: { id: sessionId },
          select: { id: true, status: true, studyGroup: { select: { maxMembers: true } } },
        }),
      ]);

      if (!student || !session) throw notFound(!student ? 'Student' : 'Session');
      if (session.status !== 'scheduled') throw new ApiError(409, 'SESSION_NOT_BOOKABLE', 'Only scheduled sessions can be booked.');

      const existing = await tx.booking.findFirst({ where: { studentId, sessionId, status: 'confirmed' }, select: { id: true } });
      if (existing) throw new ApiError(409, 'ALREADY_BOOKED', 'The student already has a confirmed booking for this session.');

      const confirmedCount = await tx.booking.count({ where: { sessionId, status: 'confirmed' } });
      if (confirmedCount >= session.studyGroup.maxMembers) throw new ApiError(409, 'SESSION_FULL', 'The session has reached its capacity.');

      return tx.booking.create({
        data: { id: makePublicId(), studentId, sessionId, status: 'confirmed' },
        include: bookingInclude,
      });
    }, { timeout: 60000 });

    response.status(201).json({ data: toBooking(booking) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      next(new ApiError(409, 'ALREADY_BOOKED', 'The student already has a confirmed booking for this session.'));
      return;
    }
    next(error);
  }
});

router.get('/:id', validateParams(bookingIdParamsSchema), async (request, response, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: request.params.id }, include: bookingInclude });
    if (!booking) throw notFound('Booking');
    response.json({ data: toBooking(booking) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateParams(bookingIdParamsSchema), validateBody(cancelBookingBodySchema), async (request, response, next) => {
  try {
    const current = await prisma.booking.findUnique({ where: { id: request.params.id }, include: bookingInclude });
    if (!current) throw notFound('Booking');
    const booking = current.status === 'cancelled'
      ? current
      : await prisma.booking.update({ where: { id: request.params.id }, data: { status: 'cancelled' }, include: bookingInclude });
    response.json({ data: toBooking(booking) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validateParams(bookingIdParamsSchema), async (request, response, next) => {
  try {
    // DELETE is available for the brief; the app uses PATCH for cancellation instead.
    await prisma.booking.delete({ where: { id: request.params.id } });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const bookingRouter = router;
