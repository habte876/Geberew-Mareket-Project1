ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE otps
  DROP CONSTRAINT IF EXISTS otps_purpose_check;

ALTER TABLE otps
  ADD CONSTRAINT otps_purpose_check
  CHECK (purpose IN ('password_reset', 'account_verification'));
