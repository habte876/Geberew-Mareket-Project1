# Geberewu Market
Geberew Market is a digital marketplace designed to connect farmers and merchants through a convenient online platform. The project provides a way for users to browse agricultural products, view product information, and interact with a marketplace focused on locally produced goods. It aims to improve access to agricultural products by providing a centralized digital shopping experience while helping farmers reach customers more directly. The system consists of a frontend and backend application that work together to provide the marketplace functionality.

Stack: React + Tailwind frontend and Express + PostgreSQL backend for Amhara crop yards.

## Run locally

1. If your system uses Podman instead of Docker, start the Podman socket, then start Postgres:

```bash
systemctl --user enable --now podman.socket
docker compose up -d
```

The database container listens on `localhost:5433` to avoid conflicting with a PostgreSQL server already using the default port.

2. Backend (open a new terminal):

```bash
cd backend
cp -n .env.example .env
npm install
npm run dev
```

If you already have a `backend/.env`, update its `DATABASE_URL` to the value in `.env.example` so it uses the project database on port `5433`.

3. Frontend (open another terminal):

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The teff harvest image is by [A. Davey](https://www.flickr.com/people/40595948@N00), licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

## Demo accounts

The database is seeded with 14 farmers and 14 merchants. Every demo account uses the password `password123`. For example:

- Farmer: Abebe Bekele / `abebe@geberewu.test`
- Farmer: Yared Solomon / `yared@geberewu.test`
- Merchant: Yonas Alemu / `yonas@geberewu.test`
- Merchant: Biniam Getachew / `biniam@geberewu.test`
