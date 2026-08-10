import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sendSms } from './sms';

describe('sendSms', () => {
  it('sends through Twilio when configured', async () => {
    let requestUrl = '';
    let requestInit: RequestInit | undefined;
    const request = async (url: string | URL | Request, init?: RequestInit) => {
      requestUrl = String(url);
      requestInit = init;
      return new Response('{}', { status: 201 });
    };

    await sendSms('+94771234567', 'Code 123456', {
      NODE_ENV: 'production',
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'secret',
      TWILIO_FROM_NUMBER: '+15005550006',
    }, request as typeof fetch);

    assert.match(requestUrl, /Accounts\/AC123\/Messages\.json$/);
    assert.equal(requestInit?.method, 'POST');
    assert.equal((requestInit?.body as URLSearchParams).get('To'), '+94771234567');
  });

  it('rejects partial Twilio configuration', async () => {
    await assert.rejects(
      sendSms('+94771234567', 'Code 123456', {
        NODE_ENV: 'production',
        TWILIO_ACCOUNT_SID: 'AC123',
      }),
      /Twilio requires/,
    );
  });

  it('rejects missing providers in production', async () => {
    await assert.rejects(
      sendSms('+94771234567', 'Code 123456', { NODE_ENV: 'production' }),
      /No SMS provider/,
    );
  });
});
