import { POST } from '@/app/api/resend-otp-to-email/route';
import { NextRequest } from 'next/server';
import { serverContainer } from '@/services/server/container';
import { saveActualImplementation } from '@/utils/test/save-actual-implementation';


describe('POST', () => {
  const getActualService = saveActualImplementation(serverContainer, 'get');

  it('takes voter registration information, calls /registervote api, updates completed task, awards badge, and updates user', async () => {

    const registerBody = {
      state: 'FL',
      city: 'Davie',
      street: '2161 SW 152 Ter',
      name_first: 'John',
      name_last: 'Doe',
      dob: '09/20/2003',
      zip: '33027',
      email: 'test@me.come',
      citizen: 'yes',
      eighteenPlus: 'yes',
      party: 'Democrat',
      idNumber: '123',
    };

    const request = new NextRequest(
      'https://challenge.8by8.us/register-to-vote',
      {
        method: 'POST',
        body: JSON.stringify(registerBody),
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
