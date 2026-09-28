import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { listMeta } from '../../lib/pagination.js';
import { notFound } from '../../lib/errors.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { studentIdParamsSchema, studentListQuerySchema } from './student.schema.js';

const router = Router();

const studentSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  isTutor: true,
  createdAt: true,
  studentSubjects: { select: { subject: { select: { id: true, name: true, category: true } } } },
} as const;

const toStudent = (student: any) => ({
  id: student.id,
  name: student.name,
  email: student.email,
  bio: student.bio,
  isTutor: student.isTutor,
  createdAt: student.createdAt,
  subjects: student.studentSubjects.map((link: any) => link.subject),
});

router.get('/', validateQuery(studentListQuerySchema), async (request, response, next) => {
  try {
    const { limit, offset, sort, order, isTutor, subjectId } = request.query as unknown as ReturnType<typeof studentListQuerySchema.parse>;
    const where = {
      ...(isTutor === undefined ? {} : { isTutor }),
      ...(subjectId ? { studentSubjects: { some: { subjectId } } } : {}),
    };
    const [students, total] = await Promise.all([
      prisma.student.findMany({ where, select: studentSelect, orderBy: { [sort]: order }, skip: offset, take: limit }),
      prisma.student.count({ where }),
    ]);
    response.json({ data: students.map(toStudent), meta: listMeta(total, limit, offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(studentIdParamsSchema), async (request, response, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: request.params.id }, select: studentSelect });
    if (!student) throw notFound('Student');
    response.json({ data: toStudent(student) });
  } catch (error) {
    next(error);
  }
});

export const studentRouter = router;
