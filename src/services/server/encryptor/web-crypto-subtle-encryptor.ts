import { Encryptor } from './encryptor';
import { TextEncoder, TextDecoder } from 'util';
import { inject } from 'undecorated-di';

export const WebCryptoSubtleEncryptor = inject(
  /**
   * Encrypts and decrypts a string
   * @example
   * const encryptedData = dataEncryptor.encryptData(userEmail, validKey)
   * const decryptedData = dataEncryptor.decryptData(encryptedData)
   * console.log(decryptedData) - prints out userEmail
   */

  class DataEncryptor implements Encryptor {
    private encrypted: boolean;

    constructor() {
      this.encrypted = false;
    }

    /**
     * @encryptData
     * @param data - string to encrypt
     * @param key - a cryptoKey for encryption and decryption
     * @returns A string with the initialization vector concatenated with the encrypted data
     */

    async encryptData(data: string, key: CryptoKey): Promise<string> {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const ivAsUint8 = crypto.getRandomValues(new Uint8Array(12));

      const encryptedDataAsUint8 = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: ivAsUint8,
        },
        key,
        encodedData,
      );

      const ivAsString = Array.from(ivAsUint8)
        .map(b => String.fromCharCode(b))
        .join('');
      const encryptedDataAsArray = Array.from(
        new Uint8Array(encryptedDataAsUint8),
      );
      const encryptedDataAsString = encryptedDataAsArray
        .map(byte => String.fromCharCode(byte))
        .join('');

      this.encrypted = true;
      return ivAsString + encryptedDataAsString;
    }

    /**
     * @decryptData
     * @param data - string with the initialization vector concatenated with encrypted data
     * @returns unencrypted user data
     */

    async decryptData(dataToDecrypt: string, key: CryptoKey): Promise<string> {
      if (!this.encrypted) {
        throw new Error(
          'Trying to decrypt data before encyrption is not allowed.',
        );
      }

      if (dataToDecrypt.length < 13) {
        throw new Error('Trying to decrypt an empty string is not allowed.');
      }

      const ivAsString = dataToDecrypt.slice(0, 12);
      const ivAsUint8 = new Uint8Array(
        Array.from(ivAsString).map(ch => ch.charCodeAt(0)),
      );
      const encryptedDataAsString = dataToDecrypt.slice(12);
      const encryptedDataAsUint8 = new Uint8Array(
        Array.from(encryptedDataAsString).map(ch => ch.charCodeAt(0)),
      );

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivAsUint8,
        },
        key,
        encryptedDataAsUint8,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    }
  },
  [],
);
