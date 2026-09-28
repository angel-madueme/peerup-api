import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError, validationMessage } from '../lib/errors.js';

export const validateQuery = <T>(schema: ZodType<T>): RequestHandler => (request, response, next) => {
  try {
    response.locals.query = schema.parse(request.query) as T;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new ApiError(400, 'INVALID_QUERY', validationMessage(error, 'query parameter')));
      return;
    }
    next(error);
  }
};

export const validateBody = <T>(schema: ZodType<T>): RequestHandler => (request, response, next) => {
  try {
    response.locals.body = schema.parse(request.body) as T;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new ApiError(422, 'VALIDATION_ERROR', validationMessage(error)));
      return;
    }
    next(error);
  }
};

export const validateParams = <T>(schema: ZodType<T>): RequestHandler => (request: Request, response: Response, next: NextFunction) => {
  try {
    response.locals.params = schema.parse(request.params) as T;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
      return;
    }
    next(error);
  }
};
