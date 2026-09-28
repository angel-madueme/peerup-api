import { describe, expect, it } from 'vitest';
import { bookingListQuerySchema } from './bookings/booking.schema.js';
import { sessionListQuerySchema } from './sessions/session.schema.js';
import { studentListQuerySchema } from './students/student.schema.js';
import { studyGroupListQuerySchema, studyGroupSessionQuerySchema } from './study-groups/study-group.schema.js';
import { subjectListQuerySchema } from './subjects/subject.schema.js';

const listSchemas = [
  ['students', studentListQuerySchema, 'createdAt'],
  ['subjects', subjectListQuerySchema, 'name'],
  ['study groups', studyGroupListQuerySchema, 'createdAt'],
  ['study group sessions', studyGroupSessionQuerySchema, 'startTime'],
  ['sessions', sessionListQuerySchema, 'startTime'],
  ['bookings', bookingListQuerySchema, 'createdAt'],
] as const;

describe('list query defaults', () => {
  it.each(listSchemas)('%s applies defaults to an empty query', (_name, schema, sort) => {
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.order).toBe('asc');
      expect(result.data.sort).toBe(sort);
    }
  });

  it('treats empty pagination and sort values as missing', () => {
    const result = subjectListQuerySchema.safeParse({ limit: '', offset: '', sort: '', order: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ limit: 20, offset: 0, sort: 'name', order: 'asc' });
  });
});

describe('pagination and sort validation', () => {
  it('clamps a limit above 100', () => {
    const result = subjectListQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(100);
  });

  it.each([
    ['limit below 1', { limit: '0' }, 'limit'],
    ['negative offset', { offset: '-1' }, 'offset'],
    ['non-numeric offset', { offset: 'not-a-number' }, 'offset'],
  ])('rejects %s', (_name, input, field) => {
    const result = subjectListQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  it.each(listSchemas)('rejects an unknown sort field for %s', (_name, schema) => {
    const result = schema.safeParse({ sort: 'unknown' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'sort')).toBe(true);
  });
});
