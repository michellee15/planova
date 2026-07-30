BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7) NOT NULL DEFAULT '#eea083';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_avatar_color_hex_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_avatar_color_hex_check
    CHECK (avatar_color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END;
$$;

COMMIT;
