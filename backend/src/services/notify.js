async function postWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendEmail(destination, subject, body) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await postWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Geberewu Market <noreply@geberewu.market>",
      to: [destination],
      subject,
      text: body,
    }),
  });
  if (!response.ok) throw new Error(`Email provider rejected the reset message (${response.status}).`);
  return true;
}

async function sendSms(destination, body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) return false;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ To: destination, From: TWILIO_FROM_NUMBER, Body: body });
  const response = await postWithTimeout(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    }
  );
  if (!response.ok) throw new Error(`SMS provider rejected the reset message (${response.status}).`);
  return true;
}

export function isDeliveryConfigured(channel) {
  if (channel === "sms") {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    );
  }
  return Boolean(process.env.RESEND_API_KEY);
}

async function deliverCode({ channel, destination, subject, body }) {
  return channel === "sms" ? sendSms(destination, body) : sendEmail(destination, subject, body);
}

export async function deliverReset({ channel, destination, code }) {
  const body = `Geberewu Market password reset code: ${code}. It expires in 10 minutes. Do not share it.`;
  return deliverCode({ channel, destination, subject: "Reset your Geberewu Market password", body });
}

export async function deliverVerification({ channel, destination, code }) {
  const body = `Geberewu Market verification code: ${code}. It expires in 10 minutes. Do not share it.`;
  return deliverCode({ channel, destination, subject: "Verify your Geberewu Market account", body });
}
