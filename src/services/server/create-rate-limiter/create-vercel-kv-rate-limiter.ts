import 'server-only';
import { bind } from 'undecorated-di';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import type { CreateRateLimiterParams } from './create-rate-limiter';
import type { RateLimiter } from './rate-limiter';

export const createVercelKVRateLimiter = bind(
  (params: CreateRateLimiterParams): RateLimiter => {
    const rateLimiter = new Ratelimit({
      redis: kv,
      prefix: `@upstash/ratelimit${params.route}`,
      limiter: Ratelimit.slidingWindow(
        params.allowedRequests,
        `${params.duration}${params.durationUnit}`,
      ),
    });

    return {
      ...params,
      consumePoint: async (identifier: string) => {
        const { remaining } = await rateLimiter.limit(identifier);
        return remaining;
      },
      getRemainingPoints: async (identifier: string) => {
        const { remaining } = await rateLimiter.getRemaining(identifier);
        return remaining;
      },
      resetPoints: async (identifier: string) => {
        await rateLimiter.resetUsedTokens(identifier);
      },
    } as const;
  },
  [],
);
