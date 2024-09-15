const fs = require('fs-extra');
const path = require('path');

(async () => {
  try {
    //count how many cryptoKey we have
    const envFilePath = path.join(__dirname, '../.env');
    const envFileContent = await fs.readFile(envFilePath, 'utf-8');
    const cryptoKeyCount = (envFileContent.match(/CRYPTO_KEY_/g) || []).length;

    const newKeyName = `CRYPTO_KEY_${cryptoKeyCount + 1}`;

    const cryptoKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const rawKey = await crypto.subtle.exportKey('raw', cryptoKey);
    const keyAsBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    const newEnvVariable = `${newKeyName}=${keyAsBase64}`;

    fs.appendFile(envFilePath, `\n${newEnvVariable}`, err => {
      if (err) {
        console.error('Error writing to .env file:', err);
      } else {
        console.log(`.env file updated with ${newKeyName} successfully!`);
      }
    });
  } catch (e) {
    console.log(e);
  }
})();
