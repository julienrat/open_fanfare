import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const schemaPath = path.join(process.cwd(), 'database', 'schema_sqlite.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Lightweight migration: add is_hidden to events if missing.
const eventCols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
if (!eventCols.includes('is_hidden')) {
  db.exec("ALTER TABLE events ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0");
}

export default db;
