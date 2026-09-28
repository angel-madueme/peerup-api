const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

export const config = {
  port: numberFromEnv('PORT', 3000),
  rateLimit: numberFromEnv('RATE_LIMIT_REQUESTS', 100),
  rateWindowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  defaultLimit: numberFromEnv('DEFAULT_PAGE_LIMIT', 20),
  maxLimit: numberFromEnv('MAX_PAGE_LIMIT', 100),
};
