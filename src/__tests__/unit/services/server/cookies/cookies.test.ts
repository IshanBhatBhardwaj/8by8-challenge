import { Cookies } from '@/services/server/cookies/cookies';
import { MockNextCookies } from '@/utils/test/mock-next-cookies';
import { CookieNames } from '@/constants/cookie-names';
import { createId } from '@paralleldrive/cuid2';
import { WebCryptoSubtleEncryptor } from '@/services/server/encryptor/web-crypto-subtle-encryptor';

const mockCookies = new MockNextCookies();
const webCryptoSubtleEncryptor = new WebCryptoSubtleEncryptor();

jest.mock('next/headers', () => ({
  cookies: () => mockCookies.cookies(),
}));

describe('Cookies', () => {
  afterEach(() => {
    mockCookies.cookies().clear();
  });

  afterAll(() => jest.unmock('next/headers'));

  it('sets, retrieves, and deletes cookies.', async () => {
    const cookies = new Cookies(webCryptoSubtleEncryptor);
    const emailForSignIn = 'user@example.com';
    await cookies.setEmailForSignIn(emailForSignIn);
    await expect(cookies.loadEmailForSignIn()).resolves.toBe(emailForSignIn);
    cookies.clearEmailForSignIn();
    await expect(cookies.loadEmailForSignIn()).resolves.toBe('');
  });
});
