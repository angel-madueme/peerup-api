import type { RequestHandler } from 'express';
import { config } from '../config/index.js';

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

export const rateLimit: RequestHandler = (request, response, next) => {
  const now = Date.now();
  const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
  const current = counters.get(key);
  const counter = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + config.rateWindowMs }
    : current;

  counter.count += 1;
  counters.set(key, counter);

  if (counter.count > config.rateLimit) {
    const retryAfter = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));
    response.setHeader('Retry-After', retryAfter);
    response.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded.' } });
    return;
  }

  next();
};
