import { POST } from '@/app/api/signin-with-otp/route';
import { rateLimiter } from '@/app/api/signin-with-otp/rate-limiter';
import { NextRequest } from 'next/server';
import { serverContainer } from '@/services/server/container';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import { UserType } from '@/model/enums/user-type';
import { ServerError } from '@/errors/server-error';
import { Builder } from 'builder-pattern';
import { DateTime } from 'luxon';
import { saveActualImplementation } from '@/utils/test/save-actual-implementation';
import type { Auth } from '@/services/server/auth/auth';
import type { User } from '@/model/types/user';
import type { ICookies } from '@/services/server/cookies/i-cookies';

describe('POST', () => {
  const getActualService = saveActualImplementation(serverContainer, 'get');
  const ip = '1.2.3.4';

  beforeEach(async () => {
    await rateLimiter.resetPoints(ip);
  });

  it(`clears the cookie in which the email for sign in was stored and then 
  returns the User when authentication is successful.`, async () => {
    const user: User = {
      uid: '0',
      email: 'user@example.com',
      name: 'User',
      avatar: '0',
      type: UserType.Challenger,
      completedActions: {
        electionReminders: false,
        registerToVote: false,
        sharedChallenge: false,
      },
      completedChallenge: false,
      badges: [],
      contributedTo: [],
      challengeEndTimestamp: DateTime.now().plus({ days: 8 }).toUnixInteger(),
      inviteCode: 'test-invite-code',
    };

    const clearEmailForSignIn = jest.fn();

    const containerSpy = jest
      .spyOn(serverContainer, 'get')
      .mockImplementation(key => {
        if (key.name === SERVER_SERVICE_KEYS.Auth.name) {
          return Builder<Auth>()
            .signInWithEmailAndOTP(() =>
              Promise.resolve({ user, invitedBy: null }),
            )
            .build();
        } else if (key.name === SERVER_SERVICE_KEYS.Cookies.name) {
          return Builder<ICookies>()
            .clearEmailForSignIn(clearEmailForSignIn)
            .build();
        }

        return getActualService(key);
      });

    const request = new NextRequest(
      'https://challenge.8by8.us/signin-with-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email: user.email, otp: '123456' }),
        ip,
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.user).toEqual(user);

    expect(clearEmailForSignIn).toHaveBeenCalled();

    containerSpy.mockRestore();
  });

  it(`returns a response with a status code matching that of a ServerError 
  thrown by the Auth service.`, async () => {
    const containerSpy = jest
      .spyOn(serverContainer, 'get')
      .mockImplementation(key => {
        if (key.name === SERVER_SERVICE_KEYS.Auth.name) {
          return Builder<Auth>()
            .signInWithEmailAndOTP(() => {
              throw new ServerError('Incorrect email or password.', 401);
            })
            .build();
        }

        return getActualService(key);
      });

    const request = new NextRequest(
      'https://challenge.8by8.us/signin-with-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', otp: '123456' }),
        ip,
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.error).toBe('Incorrect email or password.');

    containerSpy.mockRestore();
  });

  it(`returns a response with a status code of 400 when the request body 
    could not be parsed.`, async () => {
    const request = new NextRequest(
      'https://challenge.8by8.us/signin-with-otp',
      {
        method: 'POST',
        body: JSON.stringify({}),
        ip,
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it(`returns a response with a status code of 500 when any other error is 
  caught.`, async () => {
    const containerSpy = jest
      .spyOn(serverContainer, 'get')
      .mockImplementation(key => {
        if (key.name === SERVER_SERVICE_KEYS.Auth.name) {
          return Builder<Auth>()
            .signInWithEmailAndOTP(() => {
              throw new Error();
            })
            .build();
        }

        return getActualService(key);
      });

    const request = new NextRequest(
      'https://challenge.8by8.us/signin-with-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', otp: '123456' }),
        ip,
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(500);

    const responseBody = await response.json();
    expect(responseBody.error).toBe('An unknown error occurred.');

    containerSpy.mockRestore();
  });

  it(`consumes a point from its RateLimiter when authentication fails, and 
    returns a response with a status of 429 when there are no more points 
    remaining.`, async () => {
    const containerSpy = jest
      .spyOn(serverContainer, 'get')
      .mockImplementation(key => {
        if (key.name === SERVER_SERVICE_KEYS.Auth.name) {
          return Builder<Auth>()
            .signInWithEmailAndOTP(() => {
              throw new ServerError('Incorrect email or password.', 401);
            })
            .build();
        }

        return getActualService(key);
      });

    for (let i = 0; i < rateLimiter.allowedRequests * 2; i++) {
      const request = new NextRequest(
        'https://challenge.8by8.us/signin-with-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', otp: '123456' }),
          ip,
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(i < rateLimiter.allowedRequests ? 401 : 429);

      const responseBody = await response.json();
      expect(responseBody.error).toBe(
        i < rateLimiter.allowedRequests ?
          'Incorrect email or password.'
        : 'Too many requests.',
      );
    }

    containerSpy.mockRestore();
  });
});
