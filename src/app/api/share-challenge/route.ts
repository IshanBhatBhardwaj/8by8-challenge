import 'server-only';
import { NextResponse } from 'next/server';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import { ServerError } from '@/errors/server-error';

export async function PUT() {
  const auth = serverContainer.get(SERVER_SERVICE_KEYS.Auth);
  const userRepo = serverContainer.get(SERVER_SERVICE_KEYS.UserRepository);

  try {
    const user = await auth.loadSessionUser();

    if (!user) {
      return NextResponse.json({ message: 'user not found' }, { status: 401 });
    }

    const updatedUser = await userRepo.awardSharedBadge(user.uid);

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (e) {
    if (e instanceof ServerError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
