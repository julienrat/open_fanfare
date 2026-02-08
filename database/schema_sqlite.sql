PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS instruments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS musicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  color TEXT,
  email TEXT,
  phone TEXT,
  instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (first_name, last_name)
);

CREATE INDEX IF NOT EXISTS musicians_last_first_idx ON musicians(last_name, first_name);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  price TEXT,
  organizer TEXT,
  setlist TEXT,
  event_status TEXT NOT NULL DEFAULT 'prise de contact',
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (title, date)
);

CREATE TABLE IF NOT EXISTS attendance_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE,
  color TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS presences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  musician_id INTEGER NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES attendance_statuses(id) ON DELETE RESTRICT,
  comment TEXT,
  responded_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, musician_id)
);

CREATE TABLE IF NOT EXISTS event_musicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  musician_id INTEGER NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  is_required INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  UNIQUE (event_id, musician_id)
);
