import { DataEncryptorClassMethods } from './interface';
import { TextEncoder, TextDecoder } from 'util';
import { inject } from 'undecorated-di';

export const DataEncryptor = inject(
  /**
   * Encrypts and decrypts a string
   *
   * @encryptData
   * @param data - string to encrypt
   * @param key - a cryptoKey for encryption and decryption
   * @returns A string with the initialization vector concatenated with the encrypted data
   *
   * @decryptData
   * @param data - string with the initialization vector concatenated with encrypted data
   * @returns unencrypted user data
   *
   * @example
   * const encryptedData = dataEncryptor.encryptData(userEmail, validKey)
   * const decryptedData = dataEncryptor.decryptData(encryptedData)
   * console.log(decryptedData) - prints out userEmail
   */

  class DataEncryptor implements DataEncryptorClassMethods {
    private key: CryptoKey | null;
    constructor() {
      this.key = null;
    }

    async encryptData(data: string, key: CryptoKey): Promise<string> {
      const cryptoKey = key as CryptoKey;
      if (
        !cryptoKey ||
        !(
          cryptoKey.usages.includes('encrypt') &&
          cryptoKey.usages.includes('decrypt')
        )
      ) {
        throw new Error('Invalid Key.');
      }

      if (data.length < 1) {
        throw new Error('No data to encrypt.');
      }

      this.key = key;
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const ivAsUnit8Array = crypto.getRandomValues(new Uint8Array(12));

      const encryptedDataAsUnit8Array = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: ivAsUnit8Array,
        },
        this.key,
        encodedData,
      );

      const ivAsString = Array.from(ivAsUnit8Array)
        .map(b => String.fromCharCode(b))
        .join('');
      const encryptedDataAsArray = Array.from(
        new Uint8Array(encryptedDataAsUnit8Array),
      );
      const encryptedDataAsString = encryptedDataAsArray
        .map(byte => String.fromCharCode(byte))
        .join('');

      return ivAsString + encryptedDataAsString;
    }

    async decryptData(dataToDecrypt: string): Promise<string> {
      if (dataToDecrypt.length < 13) {
        throw new Error('No data to decrypt.');
      }

      if (!this.key) {
        throw new Error('Key was not given.');
      }

      const ivAsString = dataToDecrypt.slice(0, 12);
      const ivAsUnit8Array = new Uint8Array(
        Array.from(ivAsString).map(ch => ch.charCodeAt(0)),
      );
      const encryptedDataAsString = dataToDecrypt.slice(12);
      const encryptedDataAsUnit8Array = new Uint8Array(
        Array.from(encryptedDataAsString).map(ch => ch.charCodeAt(0)),
      );

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivAsUnit8Array,
        },
        this.key,
        encryptedDataAsUnit8Array,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    }
  },
  [],
);
