import 'server-only';
import { NextResponse, NextRequest } from 'next/server';
import { ServerError } from '@/errors/server-error';
import { registerBodySchema, supabaseRegisterBodySchema } from './register-body-schema';
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
  const voterRegistrationRepository = serverContainer.get(SERVER_SERVICE_KEYS.VoterRepository)

  try {
    const data = await response.json();

    const dataForSupabase = {...data}
    dataForSupabase.user_id = user.uid
    dataForSupabase.us_state = dataForSupabase.state
    delete dataForSupabase.state
    dataForSupabase.eighteen_plus = dataForSupabase.eighteenPlus
    delete dataForSupabase.eighteenPlus
    dataForSupabase.id_number = dataForSupabase.idNumber
    delete dataForSupabase.idNumber

    const registerBody = registerBodySchema.parse(data);
    const supabaseRegisterBody = supabaseRegisterBodySchema.parse(dataForSupabase)

    // perhaps make this a service as well
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

    voterRegistrationRepository.insertVoterRegistrationInfo(
      user.uid,
      supabaseRegisterBody,
    );
    userRepo.updateRegisterToVoteAction(user.uid)
    userRepo.awardVoterRegistrationActionBadge(user.uid, user.badges)

    const updatedUser = await userRepo.getUserById(user.uid);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (e) {
    if (e instanceof ServerError) {
      console.log("Server Error", e.message)
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    console.log("Bad data")
    return NextResponse.json({ error: 'bad data.' }, { status: 400 });
  }
}
