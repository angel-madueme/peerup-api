import type { Response } from 'express';

export type ValidatedLocals<Query = unknown, Params = unknown, Body = unknown> = {
  query: Query;
  params: Params;
  body: Body;
};

export const validatedQuery = <T>(response: Response): T => response.locals.query as T;
export const validatedParams = <T>(response: Response): T => response.locals.params as T;
export const validatedBody = <T>(response: Response): T => response.locals.body as T;
