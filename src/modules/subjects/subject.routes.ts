import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { notFound } from '../../lib/errors.js';
import { validatedParams, validatedQuery } from '../../lib/validated.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { studyGroupListQuerySchema } from '../study-groups/study-group.schema.js';
import { studyGroupInclude, toStudyGroup } from '../study-groups/study-group.view.js';
import { subjectIdParamsSchema, subjectListQuerySchema } from './subject.schema.js';

const router = Router();
const subjectSelect = { id: true, name: true, category: true } as const;

router.get('/', validateQuery(subjectListQuerySchema), async (request, response, next) => {
  try {
    const { limit, offset, sort, order, category } = validatedQuery<ReturnType<typeof subjectListQuerySchema.parse>>(response);
    const where = category ? { category } : {};
    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({ where, select: subjectSelect, orderBy: { [sort]: order }, skip: offset, take: limit }),
      prisma.subject.count({ where }),
    ]);
    response.json({ data: subjects, meta: listMeta(total, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/study-groups', validateParams(subjectIdParamsSchema), validateQuery(studyGroupListQuerySchema), async (request, response, next) => {
  try {
    const { id } = validatedParams<ReturnType<typeof subjectIdParamsSchema.parse>>(response);
    const subject = await prisma.subject.findUnique({ where: { id }, select: { id: true } });
    if (!subject) throw notFound('Subject');
    const { limit, offset, sort, order, hasSpace } = validatedQuery<ReturnType<typeof studyGroupListQuerySchema.parse>>(response);
    const groups = await prisma.studyGroup.findMany({
      where: { subjectId: id },
      include: studyGroupInclude,
      orderBy: { [sort]: order },
    }) as any[];
    const filtered = hasSpace ? groups.filter((group) => group._count.members < group.maxMembers) : groups;
    response.json({ data: filtered.slice(offset, offset + limit).map(toStudyGroup), meta: listMeta(filtered.length, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(subjectIdParamsSchema), async (request, response, next) => {
  try {
    const { id } = validatedParams<ReturnType<typeof subjectIdParamsSchema.parse>>(response);
    const subject = await prisma.subject.findUnique({ where: { id }, select: subjectSelect });
    if (!subject) throw notFound('Subject');
    response.json({ data: subject });
  } catch (error) {
    next(error);
  }
});

export const subjectRouter = router;
