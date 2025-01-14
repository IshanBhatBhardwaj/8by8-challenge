import { Keys } from 'undecorated-di';
import type { Auth } from './auth/auth';
import type { CaptchaValidator } from './captcha-validator/captcha-validator';
import type { ICookies } from './cookies/i-cookies';
import type { UserRepository } from './user-repository/user-repository';
import type { IUserRecordParser } from './user-record-parser/i-user-record-parser';
import type { Encryptor } from './encryptor/encryptor';
import type { VoterRegistrationDataRepository } from './voter-registration-data-repository/voter-registration-data-repository';
import type { CreateSupabaseClient } from './create-supabase-client/create-supabase-client';
import type { USStateInformation } from './us-state-information/us-state-information';
import type { ValidateAddresses } from './validate-addresses/validate-addresses';
import type { InvitationsRepository } from './invitations-repository/invitations-repository';
import type { CreateRateLimiter } from './create-rate-limiter/create-rate-limiter';

const { keys } = Keys.createKeys()
  .addKey('Auth')
  .forType<Auth>()
  .addKey('CaptchaValidator')
  .forType<CaptchaValidator>()
  .addKey('Cookies')
  .forType<ICookies>()
  .addKey('createSupabaseSSRClient')
  .forType<CreateSupabaseClient>()
  .addKey('createSupabaseServiceRoleClient')
  .forType<CreateSupabaseClient>()
  .addKey('UserRecordParser')
  .forType<IUserRecordParser>()
  .addKey('UserRepository')
  .forType<UserRepository>()
  .addKey('Encryptor')
  .forType<Encryptor>()
  .addKey('USStateInformation')
  .forType<USStateInformation>()
  .addKey('validateAddresses')
  .forType<ValidateAddresses>()
  .addKey('InvitationsRepository')
  .forType<InvitationsRepository>()
  .addKey('VoterRegistrationDataRepository')
  .forType<VoterRegistrationDataRepository>()
  .addKey('createRateLimiter')
  .forType<CreateRateLimiter>();

/**
 * Keys that can be used to retrieve service classes, functions, etc. from an
 * inversion of control container. Each key is linked to a specific interface,
 * making retrieval type-safe.
 */
export const SERVER_SERVICE_KEYS = keys;
