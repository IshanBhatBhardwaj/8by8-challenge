import 'server-only';
import { inject } from 'undecorated-di';
import { cookies } from 'next/headers';
import { DateTime } from 'luxon';
import type { ICookies } from './i-cookies';
import { SERVER_SERVICE_KEYS } from '@/services/server/keys';
import { Encryptor } from '../encryptor/encryptor';
import { PRIVATE_ENVIRONMENT_VARIABLES } from '@/constants/private-environment-variables';
/**
 * An implementation of {@link ICookies}. Provides a mechanism for setting
 * cookies to track various settings, such as the email address to which a
 * one-time passcode was sent. This improves user experience by allowing certain
 * components to be rendered on the server with the user's information
 * pre-populated.
 */
export const Cookies = inject(
  class Cookies implements ICookies {
    private emailForSignInCookieName = '8by8-email-for-signin';

    constructor(private encryptor: Encryptor) {}

    async setEmailForSignIn(email: string): Promise<void> {
      const cryptoKey = await PRIVATE_ENVIRONMENT_VARIABLES.CRYPTO_KEY_COOKIES;
      const encryptedEmail = await this.encryptor.encrypt(email, cryptoKey);

      return new Promise(resolve => {
        cookies().set(this.emailForSignInCookieName, encryptedEmail, {
          expires: this.getEmailForSignInCookieExpiry(),
          sameSite: 'strict',
        });
        resolve();
      });
    }

    async loadEmailForSignIn(): Promise<string> {
      const cryptoKey = await PRIVATE_ENVIRONMENT_VARIABLES.CRYPTO_KEY_COOKIES;
      return new Promise(resolve => {
        const encryptedCookie = cookies().get(this.emailForSignInCookieName);
        const encryptedCookieAsString = encryptedCookie?.value ?? '';
        if (encryptedCookieAsString == '') {
          return resolve('');
        }
        const cookie = this.encryptor.decrypt(
          encryptedCookieAsString,
          cryptoKey,
        );
        resolve(cookie);
      });
    }

    clearEmailForSignIn(): void {
      cookies().delete(this.emailForSignInCookieName);
    }

    private getEmailForSignInCookieExpiry() {
      return DateTime.now().plus({ hours: 1 }).toMillis();
    }
  },
  [SERVER_SERVICE_KEYS.Encryptor],
);
