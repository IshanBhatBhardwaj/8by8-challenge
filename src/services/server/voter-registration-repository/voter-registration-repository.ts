import 'server-only';
import { VoterRepository, RegisterBody } from './voter-registration';
import { ServerError } from '@/errors/server-error';
import { SERVER_SERVICE_KEYS } from '../keys';
import { inject } from 'undecorated-di';
import { Encryptor } from '../encryptor/encryptor';
import type { CreateSupabaseClient } from '../create-supabase-client/create-supabase-client';
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
        const cryptoKey = await PRIVATE_ENVIRONMENT_VARIABLES.CRYPTO_KEY;

        const encryptedObject = { ...obj };
        for (const key in encryptedObject) {
          if (Object.prototype.hasOwnProperty.call(encryptedObject, key)) {
            const typedKey = key as keyof typeof encryptedObject;
            const value = encryptedObject[typedKey];
            if (value) {
              if (typedKey === "user_id") {
                encryptedObject["user_id"] = id;
                continue
              }
              const encryptedValue = await dataEncryptor.encrypt(
                value,
                cryptoKey,
              );
              const base64EncodedValue = Buffer.from(encryptedValue).toString('base64');  
              encryptedObject[typedKey] = base64EncodedValue;
            }
          }
        }
        return encryptedObject;
      };

      const encryptedRegisterBody = await encryptRegisterBody(RegisterBody);      
      const supabase =  this.createSupabaseClient();
      const { error } = await supabase
        .from('registration_information')
        .insert(encryptedRegisterBody)
        .eq('user_id', id);
      if (error) {
        throw new ServerError(error.message, 500);
      }
    }
  },
  [SERVER_SERVICE_KEYS.createSupabaseClient, SERVER_SERVICE_KEYS.Encryptor],
);
