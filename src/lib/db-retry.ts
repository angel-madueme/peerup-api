import { Prisma } from '@prisma/client';
import { config } from '../config/index.js';
import { ApiError } from './errors.js';

const connectionErrorCodes = new Set(['P1001', 'P1002', 'P1017', 'P2028']);

export const isDatabaseConnectionError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && connectionErrorCodes.has(error.code);

const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const retryDelay = (retryNumber: number) => {
  const exponentialDelay = config.dbRetryBaseDelayMs * (2 ** retryNumber);
  return Math.round(exponentialDelay + Math.random() * exponentialDelay * 0.25);
};

export const withPrismaRetry = async <T>(operation: () => Promise<T>, canRetry: () => boolean = () => true): Promise<T> => {
  for (let retryNumber = 0; ; retryNumber += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isDatabaseConnectionError(error) || !canRetry() || retryNumber >= config.dbRetryCount) {
        if (isDatabaseConnectionError(error)) {
          console.error('Database connection failed after retries.', error);
          throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'The database is temporarily unavailable.', 1);
        }
        throw error;
      }

      await sleep(retryDelay(retryNumber));
    }
  }
};

export const warmUpDatabase = async (query: () => Promise<unknown>) => {
  const warmupAttempts = 5;
  for (let attempt = 1; attempt <= warmupAttempts; attempt += 1) {
    console.info(`Database warm-up attempt ${attempt}/${warmupAttempts}.`);
    try {
      await query();
      console.info('Database warm-up succeeded.');
      return true;
    } catch (error) {
      if (attempt === warmupAttempts) {
        console.error('Database warm-up failed after 5 attempts. The server will remain available.', error);
        return false;
      }
      await sleep(config.dbRetryBaseDelayMs);
    }
  }
  return false;
};
