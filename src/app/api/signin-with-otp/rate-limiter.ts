import 'server-only';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';

export const rateLimiter = serverContainer.get(
  SERVER_SERVICE_KEYS.createRateLimiter,
)({
  route: '/signin-with-otp',
  allowedRequests: 10,
  duration: 1,
  durationUnit: 'd',
});
