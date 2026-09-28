const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const trustProxyFromEnv = () => {
  const configured = process.env.TRUST_PROXY;
  if (configured === undefined) return process.env.NODE_ENV === 'production' ? 1 : false;
  if (configured === 'true') return true;
  if (configured === 'false') return false;
  const value = Number(configured);
  return Number.isFinite(value) ? value : false;
};

const corsOriginsFromEnv = () => {
  const configured = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured && configured.length > 0 ? configured : ['*'];
};

export const config = {
  port: numberFromEnv('PORT', 3000),
  trustProxy: trustProxyFromEnv(),
  corsOrigins: corsOriginsFromEnv(),
  rateLimit: numberFromEnv('RATE_LIMIT_REQUESTS', 100),
  rateWindowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  defaultLimit: numberFromEnv('DEFAULT_PAGE_LIMIT', 20),
  maxLimit: numberFromEnv('MAX_PAGE_LIMIT', 100),
  dbRetryCount: numberFromEnv('DB_RETRY_COUNT', 3),
  dbRetryBaseDelayMs: numberFromEnv('DB_RETRY_BASE_DELAY_MS', 300),
  dbTransactionTimeoutMs: numberFromEnv('DB_TRANSACTION_TIMEOUT_MS', 15000),
  dbTransactionMaxWaitMs: numberFromEnv('DB_TRANSACTION_MAX_WAIT_MS', 10000),
};
