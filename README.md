# Geberewu Market

React + Tailwind frontend and Express + PostgreSQL backend for Amhara crop yards.

## Run locally

### Prerequisites

- Node.js 18 or newer and npm
- Docker Desktop (or Docker Engine) with the Docker Compose plugin
- Git, if cloning the project

### First-time setup

1. Get the project files by cloning the repository or downloading and extracting its ZIP. Open a terminal in the project folder (the folder containing this README):

	```bash
	cd "/path/to/Geberew Market"
	```

2. Start the PostgreSQL database. Leave it running while using the app:

	```bash
	docker compose up -d
	```

3. Open a second terminal, install backend dependencies, and create the local environment file:

	```bash
	cd backend
	npm install
	cp .env.example .env
	```

	The example configuration connects to the local database created by Docker Compose. The backend creates its tables and demo data automatically when it starts.

4. Start the backend and leave this terminal running:

	```bash
	npm run dev
	```

	The API runs at `http://localhost:4000`. You can check it at `http://localhost:4000/api/health`; a working server returns JSON with `"ok": true`.

5. Open a third terminal, install frontend dependencies, and start the frontend:

	```bash
	cd frontend
	npm install
	npm run dev
	```

6. Open [http://localhost:5173](http://localhost:5173) in your browser. Keep all three terminals (database, backend, and frontend) running while using the app.

### Demo logins

The demo accounts are created automatically on an empty database. Both use password `password123`:

- Farmer: Abebe Bekele, `abebe@geberewu.test`
- Merchant: Yonas Alemu, `yonas@geberewu.test`

### Stop and restart

- Stop the backend and frontend by pressing `Ctrl+C` in their terminals.
- Stop the database with `docker compose down` from the project folder. Its data is kept in a Docker volume, so it will still be there next time you run `docker compose up -d`.
- To remove the database and all its data and start over, run `docker compose down -v` from the project folder.

### Troubleshooting

- If Docker reports that port `5432` is already in use, stop the other PostgreSQL service or change the Compose port and matching `DATABASE_URL` in `backend/.env`.
- If the backend cannot connect to PostgreSQL, confirm the database container is running with `docker compose ps`, then check `DATABASE_URL` in `backend/.env`.
- If port `4000` or `5173` is already in use, stop the other app using it. The frontend's API proxy expects the backend at `http://localhost:4000`.
- If you change `.env.example`, re-copy it only if you have not customized your existing `backend/.env`; copying over it will replace your local settings.

Password resets use Resend for email (`RESEND_API_KEY`, `EMAIL_FROM`) or Twilio for SMS (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`). Configure the matching provider before enabling that reset channel in production. Without credentials, development mode records a redacted delivery log and shows a reset preview link on the forgot-password page; production returns a configuration error instead of claiming delivery.

Optional: set `PRICE_FEED_URL` to a JSON feed with `{ "etbScale": 1.0 }` to replace the default USD/ETB calibration.
