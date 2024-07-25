import { DataEncryptor } from '../../../../../services/server/encryption/DataEncryptor';

describe('DataEncryptor class', () => {
  it('encrypt and decrypt a string', async () => {
    const dataEncryptor = new DataEncryptor();
    const userEmail = 'test123@me.com';
    const newKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );
    const encryptedEmail = await dataEncryptor.encryptData(userEmail, newKey);
    await expect(encryptedEmail.length).toBeGreaterThan(12);
    await expect(encryptedEmail).not.toBe(userEmail);
    const decryptedData = await dataEncryptor.decryptData(encryptedEmail);
    await expect(decryptedData).toBe(userEmail);
  });

  it('decrypt a string before encrypting', async () => {
    const dataEncryptor = new DataEncryptor();
    const userEmail = 'test123@me.com';
    await expect(dataEncryptor.decryptData(userEmail)).rejects.toThrow(
      'Key was not given.',
    );
    await expect(dataEncryptor.decryptData('')).rejects.toThrow(
      'No data to decrypt.',
    );
  });

  it('encrypt string with improper key', async () => {
    const dataEncryptor = new DataEncryptor();
    const userEmail = 'test123@me.com';
    const faultyKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['decrypt'],
    );
    const validKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    await expect(
      dataEncryptor.encryptData(userEmail, faultyKey),
    ).rejects.toThrow('Invalid Key.');
    await expect(dataEncryptor.encryptData('', validKey)).rejects.toThrow(
      'No data to encrypt.',
    );
  });
});
