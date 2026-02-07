CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instruments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musicians (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  color TEXT,
  email TEXT,
  phone TEXT,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (first_name, last_name)
);

CREATE INDEX IF NOT EXISTS musicians_last_first_idx ON musicians(last_name, first_name);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  price TEXT,
  organizer TEXT,
  setlist TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (title, date)
);

CREATE TABLE IF NOT EXISTS attendance_statuses (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  color TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presences (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  musician_id INTEGER NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES attendance_statuses(id) ON DELETE RESTRICT,
  comment TEXT,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, musician_id)
);

CREATE TABLE IF NOT EXISTS event_musicians (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  musician_id INTEGER NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  UNIQUE (event_id, musician_id)
);
