import type { RateLimiter } from './rate-limiter';
import type { DurationUnit } from './duration-unit';

export interface CreateRateLimiterParams {
  route: string;
  allowedRequests: number;
  duration: number;
  durationUnit: DurationUnit;
}

export interface CreateRateLimiter {
  (params: CreateRateLimiterParams): RateLimiter;
}
