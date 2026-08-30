BEGIN;

DROP INDEX IF EXISTS users_verification_token_hash_idx;

ALTER TABLE users
  DROP COLUMN IF EXISTS email_verified_at,
  DROP COLUMN IF EXISTS verification_token_hash,
  DROP COLUMN IF EXISTS verification_token_expires_at,
  DROP COLUMN IF EXISTS verification_email_sent_at,
  DROP COLUMN IF EXISTS verification_send_count,
  DROP COLUMN IF EXISTS verification_send_window_started_at;

COMMIT;
