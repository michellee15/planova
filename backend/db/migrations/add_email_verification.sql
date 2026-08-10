BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMPTZ;

    UPDATE users
    SET email_verified_at = NOW();
  END IF;
END;
$$;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS verification_token_hash CHAR(64),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_send_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_send_window_started_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_hash_idx
  ON users (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

COMMIT;
