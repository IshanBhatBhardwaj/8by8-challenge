import 'server-only';
import { NextResponse, NextRequest } from 'next/server';
import { ServerError } from '@/errors/server-error';
import { registerBodySchema } from './register-body-schema';
import { VoterRegistrationRepository } from '@/services/server/voter-registration-repository/voter-registration-repository';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';

export async function POST(response: NextRequest) {

  const auth = serverContainer.get(SERVER_SERVICE_KEYS.Auth);
  const user = await auth.loadSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const userRepo = serverContainer.get(SERVER_SERVICE_KEYS.UserRepository);
  const encryptor = serverContainer.get(SERVER_SERVICE_KEYS.Encryptor);
  const createSupabaseClient = serverContainer.get(
    SERVER_SERVICE_KEYS.createSupabaseClient,
  );

  try {
    const data = await response.json();
    const registerBody = registerBodySchema.parse(data);

    const fetchResponse = await fetch('https://usvotes-6vsnwycl4q-uw.a.run.app/registertovote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    })

    const registerToVoteAPI = await fetchResponse.json();
    if (!registerToVoteAPI.ok) {
      return NextResponse.json({ error: registerToVoteAPI.error }, { status: fetchResponse.status });
    }
      
    const voterRegistrationRepository = new VoterRegistrationRepository(
      createSupabaseClient,
      encryptor,
    );
    voterRegistrationRepository.insertVoterRegistrationInfo(
      user.uid,
      registerBody,
    );
    voterRegistrationRepository.updateUserCompletedTask(user.uid);
    voterRegistrationRepository.awardUserBadge(user.uid, user.badges);

    const updatedUser = await userRepo.getUserById(user.uid);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (e) {
    if (e instanceof ServerError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: 'bad data.' }, { status: 400 });
  }
}
