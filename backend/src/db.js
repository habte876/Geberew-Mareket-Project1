import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://geberewu:geberewu@localhost:5432/geberewu_market",
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('farmer', 'merchant')),
      city TEXT NOT NULL,
      profile_pic TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS farmer_listings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop TEXT NOT NULL,
      city TEXT NOT NULL,
      amount_kuntal NUMERIC(12,2) NOT NULL CHECK (amount_kuntal > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS merchant_offers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      crop TEXT NOT NULL,
      city TEXT NOT NULL,
      price_etb NUMERIC(12,2) NOT NULL CHECK (price_etb > 0),
      reference_price NUMERIC(12,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, target_user_id)
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS reference_prices (
      crop TEXT NOT NULL,
      city TEXT NOT NULL,
      price_etb NUMERIC(12,2) NOT NULL,
      source TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (crop, city)
    );

    CREATE TABLE IF NOT EXISTS delivery_log (
      id SERIAL PRIMARY KEY,
      channel TEXT NOT NULL,
      destination TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_listings_crop_city ON farmer_listings (crop, city, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_offers_crop_city ON merchant_offers (crop, city, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_role_city ON users (role, city);
  `);
}
