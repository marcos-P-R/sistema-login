import rateLimit from 'express-rate-limit';

type RateLimiterConfig = {
  windowMs?: number;
  max?: number;
  skip?: () => boolean;
};

export function createRateLimiter(config: RateLimiterConfig = {}) {
  const windowMs = config.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 24 * 60 * 60 * 1000);
  const maxRequests = config.max ?? Number(process.env.RATE_LIMIT_MAX ?? 100);
  const skip = config.skip ?? (() => process.env.DISABLE_RATE_LIMITER === 'true');

  return rateLimit({
    windowMs,
    max: maxRequests,
    message: `You have exceeded the ${maxRequests} requests in ${windowMs}ms limit!`,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
  });
}

export const rateLimiterUsingThirdParty = createRateLimiter();