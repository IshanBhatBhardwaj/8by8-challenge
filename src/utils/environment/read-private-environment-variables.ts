import 'server-only';
import { constants } from 'zlib';
import { z } from 'zod';

/**
 * Reads and validates private environment variables. Can only be invoked from
 * server-side code.
 */
export async function readPrivateEnvironmentVariables() {
  const cryptoKeys = Object.keys(process.env).filter(key =>
    key.startsWith('CRYPTO_KEY'),
  );

  const cryptoKeyPromises = cryptoKeys.map(async (key) => {
    const rawKey = new Uint8Array(
      atob(process.env[key]!)
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

    return { [key]: cryptoKey };
  });

  const resolvedCryptoKeys = await Promise.all(cryptoKeyPromises);
  return {
    TURNSTILE_SECRET_KEY: z
      .string({
        required_error:
          'Could not load environment variable TURNSTILE_SECRET_KEY.',
      })
      .parse(process.env.TURNSTILE_SECRET_KEY),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string({
        required_error:
          'Could not load environment variable SUPABASE_SERVICE_ROLE_KEY',
      })
      .parse(process.env.SUPABASE_SERVICE_ROLE_KEY),
    CRYPTO_KEY: Object.assign({}, ...resolvedCryptoKeys),
  };
}






