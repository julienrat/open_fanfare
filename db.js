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

export default db;
