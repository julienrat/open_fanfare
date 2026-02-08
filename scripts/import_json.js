import fs from 'fs';
import path from 'path';
import db from '../db.js';

const decodeHtmlEntities = (value) => {
  if (!value) return value;
  let s = String(value);
  for (let i = 0; i < 2; i += 1) {
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '\"')
      .replace(/&#0*39;/g, \"'\")
      .replace(/&#x27;/gi, \"'\");
  }
  return s;
};

const jsonPath = process.argv[2] || process.env.IMPORT_JSON_PATH;
if (!jsonPath) {
  console.error('Usage: node scripts/import_json.js /path/to/export.json');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

db.pragma('foreign_keys = OFF');

db.transaction(() => {
  const tables = ['presences', 'event_musicians', 'attendance_statuses', 'events', 'musicians', 'instruments', 'sections'];
  tables.forEach((t) => db.prepare(`DELETE FROM ${t}`).run());

  const insertSection = db.prepare('INSERT INTO sections (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const insertInstrument = db.prepare('INSERT INTO instruments (id, name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMusician = db.prepare('INSERT INTO musicians (id, first_name, last_name, color, email, phone, instrument_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertEvent = db.prepare('INSERT INTO events (id, title, description, date, location, price, organizer, setlist, is_hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertStatus = db.prepare('INSERT INTO attendance_statuses (id, label, color, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertAssignment = db.prepare('INSERT INTO event_musicians (id, event_id, musician_id, is_required, notes) VALUES (?, ?, ?, ?, ?)');
  const insertPresence = db.prepare('INSERT INTO presences (id, event_id, musician_id, status_id, comment, responded_at) VALUES (?, ?, ?, ?, ?, ?)');

  (data.sections || []).forEach((row) => {
    insertSection.run(row.id, decodeHtmlEntities(row.name), row.color || null, row.created_at || row.createdAt || new Date().toISOString(), row.updated_at || row.updatedAt || new Date().toISOString());
  });
  (data.instruments || []).forEach((row) => {
    insertInstrument.run(row.id, decodeHtmlEntities(row.name), row.color || null, row.section_id ?? row.sectionId ?? null, row.created_at || row.createdAt || new Date().toISOString(), row.updated_at || row.updatedAt || new Date().toISOString());
  });
  (data.musicians || []).forEach((row) => {
    insertMusician.run(row.id, decodeHtmlEntities(row.first_name || row.firstName), decodeHtmlEntities(row.last_name || row.lastName), row.color || null, row.email || null, row.phone || null, row.instrument_id || row.instrumentId, row.created_at || row.createdAt || new Date().toISOString(), row.updated_at || row.updatedAt || new Date().toISOString());
  });
  (data.events || []).forEach((row) => {
    insertEvent.run(
      row.id,
      decodeHtmlEntities(row.title),
      decodeHtmlEntities(row.description || null),
      row.date,
      decodeHtmlEntities(row.location || null),
      decodeHtmlEntities(row.price || null),
      decodeHtmlEntities(row.organizer || null),
      decodeHtmlEntities(row.setlist || null),
      row.is_hidden ? 1 : 0,
      row.created_at || row.createdAt || new Date().toISOString(),
      row.updated_at || row.updatedAt || new Date().toISOString()
    );
  });
  (data.attendance_statuses || []).forEach((row) => {
    insertStatus.run(row.id, row.label, row.color || null, row.is_default ? 1 : 0, row.created_at || row.createdAt || new Date().toISOString(), row.updated_at || row.updatedAt || new Date().toISOString());
  });
  (data.event_musicians || []).forEach((row) => {
    insertAssignment.run(row.id, row.event_id || row.eventId, row.musician_id || row.musicianId, row.is_required ? 1 : 0, row.notes || null);
  });
  (data.presences || []).forEach((row) => {
    insertPresence.run(row.id, row.event_id || row.eventId, row.musician_id || row.musicianId, row.status_id || row.statusId, row.comment || null, row.responded_at || row.respondedAt || new Date().toISOString());
  });
})();

db.pragma('foreign_keys = ON');
console.log('Import terminé.');
