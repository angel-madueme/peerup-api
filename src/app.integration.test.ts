import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  student: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  subject: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  studyGroup: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  session: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  booking: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('./lib/prisma.js', () => ({ prisma: prismaMock }));

const { app } = await import('./app.js');

const listRoutes = [
  '/api/v1/students',
  '/api/v1/subjects',
  '/api/v1/study-groups',
  '/api/v1/sessions',
  '/api/v1/bookings',
];

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.student.findMany.mockResolvedValue([]);
  prismaMock.student.count.mockResolvedValue(0);
  prismaMock.subject.findMany.mockResolvedValue([]);
  prismaMock.subject.count.mockResolvedValue(0);
  prismaMock.studyGroup.findMany.mockResolvedValue([]);
  prismaMock.studyGroup.count.mockResolvedValue(0);
  prismaMock.session.findMany.mockResolvedValue([]);
  prismaMock.session.count.mockResolvedValue(0);
  prismaMock.booking.findMany.mockResolvedValue([]);
  prismaMock.booking.count.mockResolvedValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Peerup HTTP middleware and list endpoints', () => {
  it.each(listRoutes)('returns a list envelope for %s', async (path) => {
    const response = await request(app).get(path);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.meta).toMatchObject({ limit: 20, offset: 0, total: 0, hasMore: false });
  });

  it('defaults the subjects list and clamps an oversized limit', async () => {
    const response = await request(app).get('/api/v1/subjects?limit=5000');
    expect(response.status).toBe(200);
    expect(response.body.meta.limit).toBe(100);
    expect(response.body.meta.offset).toBe(0);
  });

  it('names a negative offset in the 400 error', async () => {
    const response = await request(app).get('/api/v1/subjects?offset=-1');
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('offset');
  });

  it('names an unknown sort field in the 400 error', async () => {
    const response = await request(app).get('/api/v1/subjects?sort=banana');
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('sort');
  });

  it('returns 404 for malformed student and booking ids', async () => {
    const studentResponse = await request(app).get('/api/v1/students/abc');
    const bookingResponse = await request(app).get('/api/v1/bookings/abc');
    expect(studentResponse.status).toBe(404);
    expect(bookingResponse.status).toBe(404);
  });

  it('returns 422 with both missing booking fields named', async () => {
    const response = await request(app).post('/api/v1/bookings').send({});
    expect(response.status).toBe(422);
    expect(response.body.error.message).toContain('studentId');
    expect(response.body.error.message).toContain('sessionId');
  });

  it('returns a standard 500 envelope for unexpected errors without a stack trace', async () => {
    const serverError = new Error('unexpected test failure');
    prismaMock.subject.findMany.mockRejectedValueOnce(serverError);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(app).get('/api/v1/subjects');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    expect(JSON.stringify(response.body)).not.toContain('stack');
    expect(errorSpy).toHaveBeenCalledWith(serverError);
  });
});
