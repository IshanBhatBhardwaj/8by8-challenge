import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requestBodySchema } from './request-body-schema';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import { ServerError } from '@/errors/server-error';
import { ZodError } from 'zod';
import { rateLimiter } from './rate-limiter';

export async function POST(request: NextRequest) {
  /* istanbul ignore next */
  const ip = request.ip ?? '127.0.0.1';
  const remainingPoints = await rateLimiter.getRemainingPoints(ip);

  if (remainingPoints <= 0) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const auth = serverContainer.get(SERVER_SERVICE_KEYS.Auth);
  const cookies = serverContainer.get(SERVER_SERVICE_KEYS.Cookies);

  try {
    const requestBody = await request.json();
    const { email, otp } = requestBodySchema.parse(requestBody);
    const session = await auth.signInWithEmailAndOTP(email, otp);
    cookies.clearEmailForSignIn();

    return NextResponse.json(session, { status: 200 });
  } catch (e) {
    if (e instanceof ServerError) {
      // Here we will consume a point since authentication failed
      await rateLimiter.consumePoint(ip);
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    } else if (e instanceof ZodError) {
      return NextResponse.json({ error: 'Bad data.' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An unknown error occurred.' },
      { status: 500 },
    );
  }
}
