import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { notFound } from '../../lib/errors.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { sessionIdParamsSchema, sessionListQuerySchema } from './session.schema.js';

const router = Router();
const sessionSelect = {
  id: true,
  startTime: true,
  endTime: true,
  locationOrLink: true,
  status: true,
  studyGroup: { select: { id: true, name: true, maxMembers: true } },
  _count: { select: { bookings: { where: { status: 'confirmed' } } } },
} as const;

const timeWhere = (when?: 'upcoming' | 'past') => {
  if (!when) return {};
  return { startTime: when === 'upcoming' ? { gte: new Date() } : { lt: new Date() } };
};

const toSession = (session: any) => ({
  id: session.id,
  startTime: session.startTime,
  endTime: session.endTime,
  locationOrLink: session.locationOrLink,
  status: session.status,
  confirmedCount: session._count.bookings,
  isFull: session._count.bookings >= session.studyGroup.maxMembers,
  studyGroup: { id: session.studyGroup.id, name: session.studyGroup.name },
});

router.get('/', validateQuery(sessionListQuerySchema), async (request, response, next) => {
  try {
    const { limit, offset, sort, order, studyGroupId, status, when } = request.query as unknown as ReturnType<typeof sessionListQuerySchema.parse>;
    const where = { ...(studyGroupId ? { studyGroupId } : {}), ...(status ? { status } : {}), ...timeWhere(when) };
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({ where, select: sessionSelect, orderBy: { [sort]: order }, skip: offset, take: limit }),
      prisma.session.count({ where }),
    ]);
    response.json({ data: sessions.map(toSession), meta: listMeta(total, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(sessionIdParamsSchema), async (request, response, next) => {
  try {
    const id = request.params.id as string;
    const session = await prisma.session.findUnique({ where: { id }, select: sessionSelect });
    if (!session) throw notFound('Session');
    response.json({ data: toSession(session) });
  } catch (error) {
    next(error);
  }
});

export const sessionRouter = router;
