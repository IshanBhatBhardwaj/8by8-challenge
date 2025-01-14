import { createVercelKVRateLimiter } from '@/services/server/create-rate-limiter/create-vercel-kv-rate-limiter';
import { v4 as uuid } from 'uuid';

describe('createVercelKVRateLimiter', () => {
  it(`returns a RateLimiter whose consumePoint() method consumes a point and 
  returns the number of points remaining.`, async () => {
    const ip = '1.2.3.4';
    const route = '/' + uuid();
    const allowedRequests = 5;

    const rateLimiter = createVercelKVRateLimiter({
      route,
      allowedRequests,
      duration: 1,
      durationUnit: 'm',
    });

    for (let i = 1; i <= allowedRequests; i++) {
      const pointsRemaining = await rateLimiter.consumePoint(ip);
      expect(pointsRemaining).toBe(allowedRequests - i);
    }

    const remaining = await rateLimiter.consumePoint(ip);
    expect(remaining).toBeLessThanOrEqual(0);
  });

  it(`returns a RateLimiter whose getRemainingPoints() method returns the number 
  of points remaining without consuming any points.`, async () => {
    const ip = '1.2.3.4';
    const route = '/' + uuid();
    const allowedRequests = 5;

    const rateLimiter = createVercelKVRateLimiter({
      route,
      allowedRequests,
      duration: 1,
      durationUnit: 'm',
    });

    for (let i = 1; i <= 5; i++) {
      const pointsRemaining = await rateLimiter.getRemainingPoints(ip);
      expect(pointsRemaining).toBe(allowedRequests);
    }
  });

  it(`returns a RateLimiter whose resetPoints() method resets the remaining 
  points.`, async () => {
    const ip = '1.2.3.4';
    const route = '/' + uuid();
    const allowedRequests = 5;

    const rateLimiter = createVercelKVRateLimiter({
      route,
      allowedRequests,
      duration: 1,
      durationUnit: 'm',
    });

    for (let i = 1; i <= allowedRequests; i++) {
      await rateLimiter.consumePoint(ip);
    }

    let remaining = await rateLimiter.getRemainingPoints(ip);
    expect(remaining).toBe(0);

    await rateLimiter.resetPoints(ip);
    remaining = await rateLimiter.getRemainingPoints(ip);
    expect(remaining).toBe(allowedRequests);
  });

  it(`returns a RateLimiter whose allowedRequests, duration, and durationUnit 
  properties can be read.`, () => {
    const route = '/' + uuid();
    const allowedRequests = 5;
    const duration = 5;
    const durationUnit = 's';

    const rateLimiter = createVercelKVRateLimiter({
      route,
      allowedRequests,
      duration,
      durationUnit,
    });

    expect(rateLimiter.route).toBe(route);
    expect(rateLimiter.allowedRequests).toBe(allowedRequests);
    expect(rateLimiter.duration).toBe(duration);
    expect(rateLimiter.durationUnit).toBe(durationUnit);
  });
});
