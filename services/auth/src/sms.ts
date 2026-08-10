type SmsEnvironment = NodeJS.ProcessEnv;

export async function sendSms(
  to: string,
  body: string,
  environment: SmsEnvironment = process.env,
  request: typeof fetch = fetch,
): Promise<void> {
  const msg91ApiKey = environment.MSG91_API_KEY;
  const msg91FlowId = environment.MSG91_FLOW_ID;

  if (msg91ApiKey && msg91FlowId) {
    const response = await request('https://api.msg91.com/api/v5/flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: msg91ApiKey },
      body: JSON.stringify({
        flow_id: msg91FlowId,
        mobiles: to.replace('+', ''),
        var1: body,
      }),
    });
    await ensureSuccessfulResponse('MSG91', response);
    return;
  }

  const twilioSid = environment.TWILIO_ACCOUNT_SID;
  const twilioToken = environment.TWILIO_AUTH_TOKEN;
  const twilioFrom = environment.TWILIO_FROM_NUMBER;

  if (twilioSid || twilioToken || twilioFrom) {
    if (!twilioSid || !twilioToken || !twilioFrom) {
      throw new Error('Twilio requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER');
    }

    const response = await request(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }),
      },
    );
    await ensureSuccessfulResponse('Twilio', response);
    return;
  }

  if (environment.NODE_ENV === 'production') {
    throw new Error('No SMS provider is configured');
  }

  console.warn(`[SMS][DEV MODE] No SMS provider configured. Message to ${to}: ${body}`);
}

async function ensureSuccessfulResponse(provider: string, response: Response): Promise<void> {
  if (response.ok) return;
  const details = await response.text();
  console.error(`[SMS] ${provider} request failed (${response.status}):`, details);
  throw new Error(`${provider} SMS provider returned ${response.status}`);
}
