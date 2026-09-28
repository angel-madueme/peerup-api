import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { notFound } from '../../lib/errors.js';
import { validatedParams, validatedQuery } from '../../lib/validated.js';
import { withPrismaRetry } from '../../lib/db-retry.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { studyGroupIdParamsSchema, studyGroupListQuerySchema, studyGroupSessionQuerySchema } from './study-group.schema.js';
import { orderStudyGroups, studyGroupInclude, toStudyGroup } from './study-group.view.js';

const router = Router();

const sessionSelect = {
  id: true,
  startTime: true,
  endTime: true,
  locationOrLink: true,
  status: true,
  _count: { select: { bookings: { where: { status: 'confirmed' } } } },
  bookings: { select: { studentId: true }, where: { status: 'confirmed' } },
} as const;

const toSession = (session: any, studentId?: string) => {
  const confirmedCount = session._count.bookings;
  return {
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    locationOrLink: session.locationOrLink,
    status: session.status,
    confirmedCount,
    isFull: confirmedCount >= session.studyGroup.maxMembers,
    bookedByStudent: Boolean(studentId && session.bookings.some((booking: any) => booking.studentId === studentId)),
  };
};

const sessionWhere = (when?: 'upcoming' | 'past') => {
  if (!when) return {};
  return { startTime: when === 'upcoming' ? { gte: new Date() } : { lt: new Date() } };
};

router.get('/', validateQuery(studyGroupListQuerySchema), async (request, response, next) => {
  try {
    const { limit, offset, sort, order, subjectId, hasSpace } = validatedQuery<ReturnType<typeof studyGroupListQuerySchema.parse>>(response);
    const groups = await withPrismaRetry(() => prisma.studyGroup.findMany({
      where: subjectId ? { subjectId } : {},
      include: studyGroupInclude,
      orderBy: [{ [sort]: order }, { id: 'asc' }],
    }));
    const filtered = hasSpace ? groups.filter((group) => group._count.members < group.maxMembers) : groups;
    const ordered = orderStudyGroups(filtered, sort, order);
    response.json({ data: ordered.slice(offset, offset + limit).map(toStudyGroup), meta: listMeta(ordered.length, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/sessions', validateParams(studyGroupIdParamsSchema), validateQuery(studyGroupSessionQuerySchema), async (request, response, next) => {
  try {
    const { id } = validatedParams<ReturnType<typeof studyGroupIdParamsSchema.parse>>(response);
    const group = await prisma.studyGroup.findUnique({ where: { id }, select: { id: true, maxMembers: true } });
    if (!group) throw notFound('Study group');
    const { limit, offset, order, status, when, studentId } = validatedQuery<ReturnType<typeof studyGroupSessionQuerySchema.parse>>(response);
    const where = { studyGroupId: id, ...(status ? { status } : {}), ...sessionWhere(when) };
    const [sessions, total] = await withPrismaRetry(() => Promise.all([
      prisma.session.findMany({ where, select: sessionSelect, orderBy: [{ startTime: order }, { id: 'asc' }], skip: offset, take: limit }),
      prisma.session.count({ where }),
    ]));
    response.json({
      data: sessions.map((session) => toSession({ ...session, studyGroup: group }, studentId)),
      meta: listMeta(total, limit, offset),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(studyGroupIdParamsSchema), async (request, response, next) => {
  try {
    const { id } = validatedParams<ReturnType<typeof studyGroupIdParamsSchema.parse>>(response);
    const group = await prisma.studyGroup.findUnique({ where: { id }, include: studyGroupInclude });
    if (!group) throw notFound('Study group');
    response.json({ data: toStudyGroup(group) });
  } catch (error) {
    next(error);
  }
});

export const studyGroupRouter = router;
