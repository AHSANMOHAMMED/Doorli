import { env } from '../../config/env.js';

/**
 * Sends OTP via MSG91 in production. In development, logs to console.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test' || !env.MSG91_API_KEY) {
    console.log(`[DEV OTP] ${phone} → ${code}`);
    return;
  }

  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: env.MSG91_API_KEY,
    },
    body: JSON.stringify({
      template_id: 'doorli_otp',
      recipients: [{ mobiles: phone.replace('+', ''), OTP: code }],
    }),
  });

  if (!response.ok) {
    throw new Error(`MSG91 SMS failed: ${response.status}`);
  }
}
