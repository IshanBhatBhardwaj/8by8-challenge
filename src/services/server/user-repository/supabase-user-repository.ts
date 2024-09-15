import 'server-only';
import { inject } from 'undecorated-di';
import { SERVER_SERVICE_KEYS } from '../keys';
import { ServerError } from '@/errors/server-error';
import type { UserRepository } from './user-repository';
import type { User } from '@/model/types/user';
import type { CreateSupabaseClient } from '../create-supabase-client/create-supabase-client';
import type { IUserRecordParser } from '../user-record-parser/i-user-record-parser';
import { Actions } from '@/model/enums/actions';

/**
 * An implementation of {@link UserRepository} that interacts with
 * a [Supabase](https://supabase.com/) database and parses rows returned from
 * that database into {@link User}s.
 */
export const SupabaseUserRepository = inject(
  class SupabaseUserRepository implements UserRepository {
    private readonly REMOTE_PROCEDURES = {
      GET_USER_BY_ID: 'get_user_by_id',
      AWARD_ELECTION_REMINDERS_BADGE: 'award_election_reminders_badge',
    };

    constructor(
      private createSupabaseClient: CreateSupabaseClient,
      private userRecordParser: IUserRecordParser,
      private canAwardBadge = (user: User): Boolean => {
        if (
          user.badges.length >= 8 ||
          user.completedChallenge ||
          user.completedActions.registerToVote
        ) {
          return false;
        }
        return true;
      },
      private updateRegisterToVoteAction = async (
        userId: string,
      ): Promise<void> => {
        const supabase = this.createSupabaseClient();

        const {
          status: status,
          statusText: statusText,
          error: challengerUpdateError,
        } = await supabase
          .from('completed_actions')
          .update({
            register_to_vote: true,
          })
          .eq('user_id', userId);

        if (challengerUpdateError) {
          throw new ServerError(statusText, status);
        }
      },
      private awardVoterRegistrationActionBadge = async (
        userId: string,
      ): Promise<void> => {
        const supabase = this.createSupabaseClient();

        const challengerActionBadge = {
          action: Actions.VoterRegistration,
          challenger_id: userId,
        };

        const {
          status: status,
          statusText: statusText,
          error: challengerActionBadgeInsertionError,
        } = await supabase
          .from('badges')
          .insert(challengerActionBadge)
          .eq('user_id', userId);

        if (challengerActionBadgeInsertionError) {
          throw new ServerError(statusText, status);
        }
      },
    ) {}
    async getUserById(userId: string): Promise<User | null> {
      const supabase = this.createSupabaseClient();

      const {
        data: dbUser,
        error,
        status,
      } = await supabase.rpc(this.REMOTE_PROCEDURES.GET_USER_BY_ID, {
        user_id: userId,
      });

      if (error) {
        throw new ServerError(error.message, status);
      }

      if (!dbUser) return null;

      try {
        const user = this.userRecordParser.parseUserRecord(dbUser);
        return user;
      } catch (e) {
        throw new ServerError('Failed to parse user data.', 400);
      }
    }

    /**
     * @awardUserBadge
     * @param user - A user to access their information
     */
    async awardAndUpdateVoterRegistrationBadgeAndAction(
      user: User,
    ): Promise<void> {
      if (!this.canAwardBadge(user)) {
        return;
      }

      await this.awardVoterRegistrationActionBadge(user.uid);
      await this.updateRegisterToVoteAction(user.uid);
    }

    async awardElectionRemindersBadge(userId: string): Promise<User> {
      const supabase = this.createSupabaseClient();

      const {
        data: dbUser,
        error,
        status,
      } = await supabase.rpc(
        this.REMOTE_PROCEDURES.AWARD_ELECTION_REMINDERS_BADGE,
        {
          user_id: userId,
        },
      );

      if (error) {
        throw new ServerError(error.message, status);
      }

      if (!dbUser) {
        throw new ServerError('User was null after update.', 500);
      }

      try {
        const user = this.userRecordParser.parseUserRecord(dbUser);
        return user;
      } catch (e) {
        throw new ServerError('Failed to parse user data.', 400);
      }
    }
  },
  [
    SERVER_SERVICE_KEYS.createSupabaseServiceRoleClient,
    SERVER_SERVICE_KEYS.UserRecordParser,
  ],
);
