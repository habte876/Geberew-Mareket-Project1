CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hashed_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('password_reset', 'account_verification')),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  reset_jti TEXT UNIQUE,
  reset_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_otps_user_purpose_expiry
  ON otps (user_id, purpose, expires_at DESC);
