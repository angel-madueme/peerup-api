import { Prisma } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config/index.js';
import { ApiError } from './errors.js';
import { withPrismaRetry } from './db-retry.js';

const connectionError = () => new Prisma.PrismaClientKnownRequestError('database unavailable', {
  code: 'P1001',
  clientVersion: 'test',
});

describe('withPrismaRetry', () => {
  beforeEach(() => {
    config.dbRetryCount = 3;
    config.dbRetryBaseDelayMs = 0;
  });

  afterEach(() => {
    config.dbRetryCount = 3;
    config.dbRetryBaseDelayMs = 300;
    vi.restoreAllMocks();
  });

  it('retries a connection error and succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(connectionError())
      .mockRejectedValueOnce(connectionError())
      .mockResolvedValue('ok');

    await expect(withPrismaRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry a conflict error', async () => {
    const operation = vi.fn().mockRejectedValue(new ApiError(409, 'SESSION_FULL', 'The session is full.'));

    await expect(withPrismaRetry(operation)).rejects.toMatchObject({ status: 409, code: 'SESSION_FULL' });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('stops after the retry limit and returns service unavailable', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const operation = vi.fn().mockRejectedValue(connectionError());

    await expect(withPrismaRetry(operation)).rejects.toMatchObject({ status: 503, code: 'SERVICE_UNAVAILABLE' });
    expect(operation).toHaveBeenCalledTimes(4);
    expect(errorSpy).toHaveBeenCalled();
  });
});
