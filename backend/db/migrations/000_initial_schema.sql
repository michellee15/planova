BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  total_budget NUMERIC(12, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'SGD',
  num_of_people INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trips_user_created_idx
  ON trips (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trip_members (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trip_members_trip_created_idx
  ON trip_members (trip_id, created_at DESC);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category VARCHAR(100),
  paid_by_member_id INTEGER REFERENCES trip_members(id) ON DELETE SET NULL,
  expense_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_trip_created_idx
  ON expenses (trip_id, created_at DESC);

CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, member_id)
);

CREATE INDEX IF NOT EXISTS expense_splits_member_idx
  ON expense_splits (member_id);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(255),
  itinerary_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(10, 6),
  formatted_address TEXT,
  place_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS itinerary_items_trip_date_idx
  ON itinerary_items (trip_id, itinerary_date, start_time);

CREATE TABLE IF NOT EXISTS settlement_payments (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  to_member_id INTEGER NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS settlement_payments_trip_paid_idx
  ON settlement_payments (trip_id, paid_at DESC);

COMMIT;
