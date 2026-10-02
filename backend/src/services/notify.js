import crypto from "crypto";
import { query } from "../db.js";

async function postWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendEmail(destination, body) {
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
      subject: "Reset your Geberewu Market password",
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

export async function deliverReset({ channel, destination, token, clientUrl }) {
  const link = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const body =
    channel === "sms"
      ? `Geberewu Market reset code: ${token}. Or open ${link}`
      : `Reset your Geberewu Market password:\n${link}\nThis link expires in 1 hour.`;

  let delivered;
  try {
    delivered = channel === "sms" ? await sendSms(destination, body) : await sendEmail(destination, body);
  } catch (error) {
    error.statusCode = 502;
    throw error;
  }
  if (!delivered && process.env.NODE_ENV === "production") {
    const error = new Error(`Password reset ${channel.toUpperCase()} delivery is not configured.`);
    error.statusCode = 503;
    throw error;
  }

  await query(
    `INSERT INTO delivery_log (channel, destination, subject, body) VALUES ($1, $2, $3, $4)`,
    [channel, destination, "Password reset", `Reset delivery ${delivered ? "sent" : "previewed"}.`]
  );

  if (delivered) return undefined;
  return { token, link, body };
}

export function newToken() {
  return crypto.randomBytes(24).toString("hex");
}
