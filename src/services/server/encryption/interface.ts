export interface DataEncryptorClassMethods {
  encryptData(data: string, key: CryptoKey): Promise<string>;
  decryptData(dataToDecrypt: string): Promise<string>;
}
