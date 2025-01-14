import 'server-only';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import type { ChainedMiddleware } from './chained-middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

const createRateLimiter = serverContainer.get(
  SERVER_SERVICE_KEYS.createRateLimiter,
);

export const rateLimiters = [
  createRateLimiter({
    route: '/api/signup-with-email',
    allowedRequests: 10,
    duration: 1,
    durationUnit: 'd',
  }),
  createRateLimiter({
    route: '/api/send-otp-to-email',
    allowedRequests: 10,
    duration: 1,
    durationUnit: 'd',
  }),
  createRateLimiter({
    route: '/api/resend-otp-to-email',
    allowedRequests: 10,
    duration: 1,
    durationUnit: 'd',
  }),
  createRateLimiter({
    route: '/api/validate-addresses',
    allowedRequests: 12,
    duration: 1,
    durationUnit: 'd',
  }),
];

export function rateLimit(next: ChainedMiddleware): ChainedMiddleware {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response?: NextResponse,
  ) => {
    const { pathname } = request.nextUrl;
    const rateLimiter = rateLimiters.find(
      limiter => limiter.route === pathname,
    );

    if (rateLimiter) {
      /* istanbul ignore next */
      const ip = request.ip ?? '127.0.0.1';
      const remainingPoints = await rateLimiter.getRemainingPoints(ip);

      if (remainingPoints <= 0) {
        return NextResponse.json(
          { error: 'Too many requests.' },
          { status: 429 },
        );
      }

      await rateLimiter.consumePoint(ip);
    }

    return next(request, event, response);
  };
}
