export interface Encryptor {
  encryptData(data: string, key: CryptoKey): Promise<string>;
  decryptData(dataToDecrypt: string, key: CryptoKey): Promise<string>;
}
