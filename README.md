# Geberewu Market
Geberew Market is a digital marketplace designed to connect farmers and merchants through a convenient online platform. The project provides a way for users to browse agricultural products, view product information, and interact with a marketplace focused on locally produced goods. It aims to improve access to agricultural products by providing a centralized digital shopping experience while helping farmers reach customers more directly. The system consists of a frontend and backend application that work together to provide the marketplace functionality.

Stack: React + Tailwind frontend and Express + PostgreSQL backend for Amhara crop yards.

## Run locally

1. Start Postgres (Docker):

```bash
docker compose up -d
```

2. Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Demo accounts (password `password123`):

- Farmer: Abebe Bekele / `abebe@geberewu.test`
- Merchant: Yonas Alemu / `yonas@geberewu.test`

New accounts must verify the email address or phone number they registered with before login. Verification and password-reset codes are delivered through Resend for email (`RESEND_API_KEY`, `EMAIL_FROM`) or Twilio for SMS (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`). Add the credentials for your chosen provider to `backend/.env` (use a verified sender address with Resend), and restart the backend. Set `PASSWORD_RESET_JWT_SECRET` to a dedicated secret of at least 32 random bytes (for example, generate one with `openssl rand -hex 32`). The OTP table and account verification schema are installed automatically on backend startup from `backend/migrations/`. Reset and verification requests are rate limited; delivery failures return HTTP 503 and invalidate undelivered codes rather than claiming they were sent. Codes and reset tokens are never returned in development responses. Keep provider credentials private and do not commit `backend/.env`.

Optional: set `PRICE_FEED_URL` to a JSON feed with `{ "etbScale": 1.0 }` to replace the default USD/ETB calibration.
