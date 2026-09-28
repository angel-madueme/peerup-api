import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../lib/errors.js';

const issuesMessage = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');

export const validateQuery = <T>(schema: ZodType<T>): RequestHandler => (request, _response, next) => {
  try {
    request.query = schema.parse(request.query) as typeof request.query;
    next();
  } catch (error) {
    next(new ApiError(400, 'INVALID_QUERY', error instanceof ZodError ? issuesMessage(error) : 'Invalid query parameters.'));
  }
};

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => (request, _response, next) => {
  try {
    request.body = schema.parse(request.body) as typeof request.body;
    next();
  } catch (error) {
    next(new ApiError(422, 'VALIDATION_ERROR', error instanceof ZodError ? issuesMessage(error) : 'Invalid request body.'));
  }
};

export const validateParams = <T>(schema: ZodType<T>): RequestHandler => (request: Request, _response: Response, next: NextFunction) => {
  try {
    request.params = schema.parse(request.params) as typeof request.params;
    next();
  } catch {
    next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
  }
};
