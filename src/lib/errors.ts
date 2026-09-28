import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFound = (resource: string) => new ApiError(404, 'NOT_FOUND', `${resource} not found.`);

const validationMessage = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({ error: { code: 'VALIDATION_ERROR', message: validationMessage(error) } });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ error: { code: 'ALREADY_BOOKED', message: 'The student already has a confirmed booking for this session.' } });
      return;
    }
    if (error.code === 'P2025') {
      response.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
      return;
    }
  }

  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } });
};
