BEGIN;

CREATE TABLE IF NOT EXISTS trip_collaborators (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS trip_collaborators_user_status_idx
  ON trip_collaborators (user_id, status);

CREATE INDEX IF NOT EXISTS trip_collaborators_trip_status_idx
  ON trip_collaborators (trip_id, status);

COMMIT;
