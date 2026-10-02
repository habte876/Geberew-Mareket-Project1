# Geberewu Market

React + Tailwind frontend and Express + PostgreSQL backend for Amhara crop yards.

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

Password resets use Resend for email (`RESEND_API_KEY`, `EMAIL_FROM`) or Twilio for SMS (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`). Configure the matching provider before enabling that reset channel in production. Without credentials, development mode records a redacted delivery log and shows a reset preview link on the forgot-password page; production returns a configuration error instead of claiming delivery.

Optional: set `PRICE_FEED_URL` to a JSON feed with `{ "etbScale": 1.0 }` to replace the default USD/ETB calibration.
