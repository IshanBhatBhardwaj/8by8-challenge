import 'server-only';
import { VoterRepository, RegisterBody } from './voter-registration';
import { ServerError } from '@/errors/server-error';
import { SERVER_SERVICE_KEYS } from '../keys';
import { inject } from 'undecorated-di';
import { Encryptor } from '../encryptor/encryptor';
import type { CreateSupabaseClient } from '../create-supabase-client/create-supabase-client';
import { Actions } from '@/model/enums/actions';
import { ActionBadge } from '@/model/types/action-badge';
import type { Badge } from '@/model/types/badge';
import { PRIVATE_ENVIRONMENT_VARIABLES } from '@/constants/private-environment-variables';

export const VoterRegistrationRepository = inject(
  /**
   * handles voter registration proccess
   * @example
   */
  class SupabaseVoterRepository implements VoterRepository {
    constructor(
      private createSupabaseClient: CreateSupabaseClient,
      private encryptor: Encryptor,
    ) {}
    /**
     * @insertVoterRegistrationInfo
     * @param RegisterBody - Voter registration information to insert
     */
    async insertVoterRegistrationInfo(
      id: string,
      RegisterBody: RegisterBody,
    ): Promise<void> {
      const dataEncryptor = this.encryptor;

      //helper function that encrypts the register body
      const encryptRegisterBody = async (
        obj: typeof RegisterBody,
      ): Promise<typeof RegisterBody> => {
        const base64Key = PRIVATE_ENVIRONMENT_VARIABLES.CRYPTO_KEY;
        const rawKey = new Uint8Array(
          atob(base64Key)
            .split('')
            .map(char => char.charCodeAt(0)),
        );
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          rawKey,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt'],
        );

        const encryptedObject = { ...obj };
        for (const key in encryptedObject) {
          if (Object.prototype.hasOwnProperty.call(encryptedObject, key)) {
            const typedKey = key as keyof typeof encryptedObject;
            const encryptedValue = await dataEncryptor.encrypt(
              encryptedObject[typedKey],
              cryptoKey,
            );
            encryptedObject[typedKey] = encryptedValue;
          }
        }
        return encryptedObject;
      };

      const encryptedRegisterBody = await encryptRegisterBody(RegisterBody);
      const supabase =  this.createSupabaseClient();

      //This always throws an error
      const { error } = await supabase
        .from('registration_information')
        .insert(encryptedRegisterBody)
        .eq('user_id', id);
      //error is caught here
      if (error) {
        throw new ServerError(error.message, 500);
      }
    }
    /**
     * @updateUserCompletedTask
     * @param id - User's id to get user
     */
    async updateUserCompletedTask(id: string): Promise<void> {
      const supabase = this.createSupabaseClient();

      const { error: challengerUpdateError } = await supabase
        .from('completed_actions')
        .update({
          register_to_vote: true,
        })
        .eq('user_id', id);

      if (challengerUpdateError) {
        throw new Error(challengerUpdateError.message);
      }
    }

    /**
     * @awardUserBadge
     * @param id - User's id to get user
     */
    async awardUserBadge(id: string, badges: Badge[]): Promise<void> {
      const supabase = this.createSupabaseClient();
      const actionBadges = badges.filter(obj => {
        return (obj as ActionBadge).action !== undefined;
      });

      let found = false;
      actionBadges.forEach(item => {
        if ((item as ActionBadge).action === 'voterRegistration') {
          found = true;
        }
      });

      if (badges.length >= 8 || found) {
        return;
      }

      const challengerActionBadge = {
        action: Actions.VoterRegistration,
        challenger_id: id,
      };

      const { error: challengerActionBadgeInsertionError } = await supabase
        .from('badges')
        .insert(challengerActionBadge)
        .eq('user_id', id);

      if (challengerActionBadgeInsertionError) {
        throw new Error(challengerActionBadgeInsertionError.message);
      }
    }
  },
  [SERVER_SERVICE_KEYS.createSupabaseClient, SERVER_SERVICE_KEYS.Encryptor],
);
