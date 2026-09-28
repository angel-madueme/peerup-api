import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFound = (resource: string) => new ApiError(404, 'NOT_FOUND', `${resource} not found.`);

const issueDetail = (issue: ZodError['issues'][number]) => {
  if (issue.code === 'too_small' && issue.minimum === 0) return 'must be 0 or greater.';
  if (issue.code === 'too_small') return `must be at least ${issue.minimum}.`;
  if (issue.code === 'invalid_type' && issue.input === undefined) return 'is required.';
  if (issue.code === 'invalid_value' && 'values' in issue) return `must be one of: ${issue.values.join(', ')}.`;
  return issue.message;
};

export const validationMessage = (error: ZodError, label: 'query parameter' | 'field' = 'field') =>
  error.issues.map((issue) => {
    const name = issue.path.join('.') || 'request';
    return `Invalid ${label} '${name}': ${issueDetail(issue)}`;
  }).join('; ');

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    if (error.status === 503) response.setHeader('Retry-After', error.retryAfterSeconds ?? 1);
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
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
};
