import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { notFound } from '../../lib/errors.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { studyGroupIdParamsSchema, studyGroupListQuerySchema, studyGroupSessionQuerySchema } from './study-group.schema.js';
import { studyGroupInclude, toStudyGroup } from './study-group.view.js';

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
    const { limit, offset, sort, order, subjectId, hasSpace } = request.query as unknown as ReturnType<typeof studyGroupListQuerySchema.parse>;
    const groups = await prisma.studyGroup.findMany({
      where: subjectId ? { subjectId } : {},
      include: studyGroupInclude,
      orderBy: { [sort]: order },
    });
    const filtered = hasSpace ? groups.filter((group) => group._count.members < group.maxMembers) : groups;
    response.json({ data: filtered.slice(offset, offset + limit).map(toStudyGroup), meta: listMeta(filtered.length, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/sessions', validateParams(studyGroupIdParamsSchema), validateQuery(studyGroupSessionQuerySchema), async (request, response, next) => {
  try {
    const group = await prisma.studyGroup.findUnique({ where: { id: request.params.id }, select: { id: true, maxMembers: true } });
    if (!group) throw notFound('Study group');
    const { limit, offset, order, status, when, studentId } = request.query as unknown as ReturnType<typeof studyGroupSessionQuerySchema.parse>;
    const where = { studyGroupId: request.params.id, ...(status ? { status } : {}), ...sessionWhere(when) };
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({ where, select: sessionSelect, orderBy: { startTime: order }, skip: offset, take: limit }),
      prisma.session.count({ where }),
    ]);
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
    const group = await prisma.studyGroup.findUnique({ where: { id: request.params.id }, include: studyGroupInclude });
    if (!group) throw notFound('Study group');
    response.json({ data: toStudyGroup(group) });
  } catch (error) {
    next(error);
  }
});

export const studyGroupRouter = router;
