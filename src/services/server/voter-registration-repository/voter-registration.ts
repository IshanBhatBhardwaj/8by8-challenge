import { Encryptor } from '../encryptor/encryptor';
import type { Badge } from '@/model/types/badge';

export interface RegisterBody {
  user_id: string | null;
  us_state: string;
  city: string;
  street: string;
  name_first: string;
  name_last: string;
  dob: string;
  zip: string;
  email: string;
  citizen: string;
  eighteen_plus: string;
  party: string;
  id_number: string;
}

export interface VoterRepository {
  insertVoterRegistrationInfo(
    id: string,
    encryptedRegisterBody: RegisterBody,
  ): Promise<void>;
  updateUserCompletedTask(id: string): Promise<void>;
  awardUserBadge(id: string, badges: Badge[]): Promise<void>;
}
