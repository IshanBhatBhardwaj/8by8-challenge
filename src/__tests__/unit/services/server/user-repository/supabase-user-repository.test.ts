import { SupabaseUserRepository } from '@/services/server/user-repository/supabase-user-repository';
import { UserRecordParser } from '@/services/server/user-record-parser/user-record-parser';
import { v4 as uuid } from 'uuid';
import { resetAuthAndDatabase } from '@/utils/test/reset-auth-and-database';
import { UserType } from '@/model/enums/user-type';
import { Actions } from '@/model/enums/actions';
import { createId } from '@paralleldrive/cuid2';
import { ServerError } from '@/errors/server-error';
import { AuthError } from '@supabase/supabase-js';
import type { CreateSupabaseClient } from '@/services/server/create-supabase-client/create-supabase-client';
import type { IUserRecordParser } from '@/services/server/user-record-parser/i-user-record-parser';
import type { Badge } from '@/model/types/badge';
import { serverContainer } from '@/services/server/container';
import { saveActualImplementation } from '@/utils/test/save-actual-implementation';
import { Builder } from 'builder-pattern';
import type { UserRepository } from '@/services/server/user-repository/user-repository';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import {
  createSupabseClientFunction,
  createUserRepository,
  createUser,
} from '@/utils/test/create-user';

describe('SupabaseUserRepository', () => {
  let userRepository: InstanceType<typeof SupabaseUserRepository>;
  let createSupabaseClient: CreateSupabaseClient;

  beforeEach(() => {
    createSupabaseClient = createSupabseClientFunction();
    userRepository = createUserRepository(createSupabaseClient);
  });

  afterEach(() => {
    return resetAuthAndDatabase();
  });

  it('returns null when getUserById is called and no user is found.', async () => {
    await expect(userRepository.getUserById(uuid())).resolves.toBe(null);
  });

  it('returns a user when getUserById is called with an existing user id.', async () => {
    const supabase = createSupabaseClient();

    // Create a challenger and award them an action badge.
    const challengerMetadata = {
      name: 'Challenger',
      avatar: '0',
      type: UserType.Challenger,
      invite_code: createId(),
    };

    const { data: challengerData, error: challengerInsertionError } =
      await supabase.auth.admin.createUser({
        email: 'challenger@example.com',
        email_confirm: true,
        user_metadata: challengerMetadata,
      });

    if (challengerInsertionError) {
      throw new Error(challengerInsertionError.message);
    }

    const authChallenger = challengerData.user!;

    const challengerActionBadge = {
      action: Actions.SharedChallenge,
      challenger_id: authChallenger!.id,
    };

    const { error: challengerActionBadgeInsertionError } = await supabase
      .from('badges')
      .insert(challengerActionBadge);

    if (challengerActionBadgeInsertionError) {
      throw new Error(challengerActionBadgeInsertionError.message);
    }

    const { error: challengerUpdateError } = await supabase
      .from('completed_actions')
      .update({
        shared_challenge: true,
      })
      .eq('user_id', authChallenger.id);

    if (challengerUpdateError) {
      throw new Error(challengerUpdateError.message);
    }

    // Create a player who has been invited by the challenger.
    const playerMetadata = {
      name: 'Player',
      avatar: '1',
      type: UserType.Player,
      invite_code: createId(),
    };

    const { data: playerData, error: playerInsertionError } =
      await supabase.auth.admin.createUser({
        email: 'player@example.com',
        email_confirm: true,
        user_metadata: playerMetadata,
      });

    if (playerInsertionError) {
      throw new Error(playerInsertionError.message);
    }

    const authPlayer = playerData.user!;

    const { error: invitedByInsertionError } = await supabase
      .from('invited_by')
      .insert({
        player_id: authPlayer.id,
        challenger_name: challengerMetadata.name,
        challenger_avatar: challengerMetadata.avatar,
        challenger_invite_code: challengerMetadata.invite_code,
      });

    if (invitedByInsertionError) {
      throw new Error(invitedByInsertionError.message);
    }

    // Complete an action on behalf of the challenger.
    const playerActionBadge = {
      action: Actions.VoterRegistration,
      challenger_id: authPlayer!.id,
    };

    const { error: playerActionBadgeInsertionError } = await supabase
      .from('badges')
      .insert(playerActionBadge);

    if (playerActionBadgeInsertionError)
      throw new Error(playerActionBadgeInsertionError.message);

    const playerContributedTo = {
      player_id: authPlayer.id,
      challenger_name: challengerMetadata.name,
      challenger_avatar: challengerMetadata.avatar,
    };

    const { error: contributedToInsertionError } = await supabase
      .from('contributed_to')
      .insert(playerContributedTo);

    if (contributedToInsertionError) {
      throw new Error(contributedToInsertionError.message);
    }

    const { error: playerUpdateError } = await supabase
      .from('completed_actions')
      .update({
        register_to_vote: true,
      })
      .eq('user_id', authPlayer.id);

    if (playerUpdateError) {
      throw new Error(playerUpdateError.message);
    }

    const playerAwardedBadge = {
      player_name: playerMetadata.name,
      player_avatar: playerMetadata.avatar,
      challenger_id: authChallenger.id,
    };

    const { error: playerAwardedBadgeInsertionError } = await supabase
      .from('badges')
      .insert(playerAwardedBadge);

    if (playerAwardedBadgeInsertionError) {
      throw new Error(playerAwardedBadgeInsertionError.message);
    }

    // Evaluate whether the challenger is returned as expected.
    const challenger = await userRepository.getUserById(authChallenger.id);

    expect(challenger).toEqual({
      uid: authChallenger.id,
      email: authChallenger.email,
      name: challengerMetadata.name,
      avatar: challengerMetadata.avatar,
      type: challengerMetadata.type,
      completedActions: {
        sharedChallenge: true,
        electionReminders: false,
        registerToVote: false,
      },
      badges: [
        {
          action: Actions.SharedChallenge,
        },
        {
          playerName: playerMetadata.name,
          playerAvatar: playerMetadata.avatar,
        },
      ],
      challengeEndTimestamp: expect.any(Number),
      completedChallenge: false,
      contributedTo: [],
      inviteCode: challengerMetadata.invite_code,
    });

    // Evaluate whether the player is returned as expected.
    const player = await userRepository.getUserById(authPlayer.id);

    expect(player).toEqual({
      uid: authPlayer.id,
      email: authPlayer.email,
      name: playerMetadata.name,
      avatar: playerMetadata.avatar,
      type: playerMetadata.type,
      completedActions: {
        sharedChallenge: false,
        electionReminders: false,
        registerToVote: true,
      },
      badges: [
        {
          action: Actions.VoterRegistration,
        },
      ],
      challengeEndTimestamp: expect.any(Number),
      completedChallenge: false,
      contributedTo: [
        {
          name: challengerMetadata.name,
          avatar: challengerMetadata.avatar,
        },
      ],
      inviteCode: playerMetadata.invite_code,
      invitedBy: {
        inviteCode: challengerMetadata.invite_code,
        name: challengerMetadata.name,
        avatar: challengerMetadata.avatar,
      },
    });
  });

  it('throws a ServerError if supabase.from().select() throws an error.', async () => {
    const errorMessage = 'test error message';

    createSupabaseClient = jest.fn().mockImplementation(() => {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: () => {
                  return Promise.resolve({
                    data: null,
                    error: new AuthError(errorMessage, 500),
                  });
                },
              }),
            }),
          }),
        }),
      };
    });

    userRepository = new SupabaseUserRepository(
      createSupabaseClient,
      new UserRecordParser(),
    );

    await expect(userRepository.getUserById('')).rejects.toThrow(
      new ServerError(errorMessage, 500),
    );
  });

  it('throws a ServerError if UserRecordParser.parseUserRecord throws an error.', async () => {
    createSupabaseClient = jest.fn().mockImplementation(() => {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: () => {
                  return Promise.resolve({
                    data: {},
                    error: null,
                  });
                },
              }),
            }),
          }),
        }),
      };
    });

    const userRecordParser: IUserRecordParser = {
      parseUserRecord: () => {
        throw new Error('Error parsing user.');
      },
    };

    userRepository = new SupabaseUserRepository(
      createSupabaseClient,
      userRecordParser,
    );

    await expect(userRepository.getUserById('')).rejects.toThrow(
      new ServerError('Failed to parse user data.', 400),
    );
  });

  it('updates users register to vote task and awads user a badge', async () => {
    const supabase = createSupabaseClient();
    const authChallenger = await createUser(supabase);

    const user = await userRepository.getUserById(authChallenger.id);
    if (!user) {
      throw new Error(`No user found with id: ${authChallenger.id}`);
    }
    expect(user.completedActions.registerToVote).toBe(false);
    expect(user.badges.length === 0);

    await userRepository.awardAndUpdateVoterRegistrationBadgeAndAction(user);

    const newUser = await userRepository.getUserById(user.uid);
    if (!newUser) {
      throw new Error(`No newUser found with id: ${user.uid}`);
    }

    expect(newUser.completedActions.registerToVote).toBe(true);

    const newUserActionBadge = [{ action: 'voterRegistration' }];
    expect(newUser.badges.length === 1);
    expect(newUser.badges === newUserActionBadge);
  });

  it('does not award the user a badge when they have more than 8 badges or already have the voterRegistration badge', async () => {
    const supabase = createSupabaseClient();
    const authChallenger = await createUser(supabase);

    const user = await userRepository.getUserById(authChallenger.id);
    if (!user) {
      throw new Error(`No user found with id: ${authChallenger.id}`);
    }

    let badgesArray: Badge[] = [
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
      { action: Actions.SharedChallenge },
    ];
    user.badges = badgesArray;

    await userRepository.awardAndUpdateVoterRegistrationBadgeAndAction(user);
    let newUser = await userRepository.getUserById(user.uid);
    if (!newUser) {
      throw new Error(`No newUser found with id: ${user.uid}`);
    }
    expect(newUser.badges.length === 0);

    badgesArray = [{ action: Actions.VoterRegistration }];
    await userRepository.awardAndUpdateVoterRegistrationBadgeAndAction(user);

    newUser = await userRepository.getUserById(user.uid);
    if (!newUser) {
      throw new Error(`No newUser found with id: ${user.uid}`);
    }
    expect(newUser.badges.length === 0);
  });

  it('throws a challengerUpdateError for the updateRegisterToVoteAction private method when there is an invalid user id', async () => {
    jest
      .spyOn(userRepository as any, 'awardVoterRegistrationActionBadge')
      .mockImplementationOnce(async () => Promise<void>);
    const supabase = createSupabaseClient();

    const authChallenger = await createUser(supabase);

    const user = await userRepository.getUserById(authChallenger.id);
    if (!user) {
      throw new Error(`No user found with id: ${authChallenger.id}`);
    }
    expect(user.completedActions.registerToVote).toBe(false);
    user.uid = '';
    await expect(
      userRepository.awardAndUpdateVoterRegistrationBadgeAndAction(user),
    ).rejects.toThrow(new ServerError('Bad Request', 400));
  });

  it('throws a challengerUpdateError for the awardVoterRegistrationActionBadge private method when there is an invalid user id', async () => {
    const supabase = createSupabaseClient();
    const authChallenger = await createUser(supabase);

    const user = await userRepository.getUserById(authChallenger.id);
    if (!user) {
      throw new Error(`No user found with id: ${authChallenger.id}`);
    }
    user.uid = '';
    await expect(
      userRepository.awardAndUpdateVoterRegistrationBadgeAndAction(user),
    ).rejects.toThrow(new ServerError('Bad Request', 400));
  });
});
