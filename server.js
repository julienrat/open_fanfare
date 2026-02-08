import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import db from './db.js';

dotenv.config();

const app = express();
const upload = multer({ dest: path.join(process.cwd(), 'tmp_uploads') });
const PORT = process.env.PORT || 8000;

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Support reverse proxy sub-paths (e.g., /sondages) via X-Forwarded-Prefix.
app.use((req, _res, next) => {
  const forwardedPrefix = req.headers['x-forwarded-prefix'];
  if (!BASE_URL && forwardedPrefix && req.url.startsWith(forwardedPrefix)) {
    req.url = req.url.slice(forwardedPrefix.length) || '/';
  }
  req.baseUrlPrefix = BASE_URL || forwardedPrefix || '';
  next();
});

const staticAssets = express.static(path.join(process.cwd(), 'public', 'assets'));
app.use('/assets', staticAssets);
if (BASE_URL) {
  app.use(`${BASE_URL}/assets`, staticAssets);
}


// Helpers
const h = (v) => (v == null ? '' : String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));

const baseUrl = (p = '', req = null) => {
  const prefix = (req && req.baseUrlPrefix) ? String(req.baseUrlPrefix) : BASE_URL;
  if (!p) return prefix;
  if (!p.startsWith('/')) p = '/' + p;
  return prefix + p;
};

const formatDatetimeLocal = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateFr = (iso, withTime = true) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
};

const normalizeHexColor = (color) => {
  if (!color) return null;
  const c = String(color).trim();
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(c) ? c : null;
};

const markdownToHtml = (text) => {
  if (!text) return '';
  const lines = String(text).split(/\r\n|\r|\n/);
  let html = '';
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }
    let escaped = h(trimmed);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/\[(.+?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    const headerMatch = escaped.match(/^#\s+(.+)/);
    if (headerMatch) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h4>${headerMatch[1]}</h4>\n`;
      continue;
    }
    const listMatch = escaped.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      html += `<li>${listMatch[1]}</li>\n`;
      continue;
    }
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    html += `<p>${escaped}</p>\n`;
  }
  if (inList) html += '</ul>\n';
  return html;
};

const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;');
};

const raw = (value) => ({ __raw: String(value ?? '') });

const decodeHtmlEntities = (value) => {
  if (!value) return value;
  let s = String(value);
  for (let i = 0; i < 2; i += 1) {
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&#x27;/gi, "'");
  }
  return s;
};

const getSections = () => db.prepare('SELECT id, name, color, created_at, updated_at FROM sections ORDER BY name ASC').all();

const getInstruments = () => {
  const rows = db.prepare(`
    SELECT i.id, i.name, i.color, i.section_id, i.created_at, i.updated_at,
           s.id AS section_id, s.name AS section_name, s.color AS section_color
    FROM instruments i
    LEFT JOIN sections s ON s.id = i.section_id
    ORDER BY i.name ASC
  `).all();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    sectionId: row.section_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    section: row.section_id ? { id: row.section_id, name: row.section_name, color: row.section_color } : null,
  }));
};

const getMusicians = () => {
  const rows = db.prepare(`
    SELECT m.id, m.first_name, m.last_name, m.color, m.email, m.phone, m.instrument_id, m.created_at, m.updated_at,
           i.id AS instrument_id, i.name AS instrument_name, i.color AS instrument_color, i.section_id,
           s.id AS section_id, s.name AS section_name, s.color AS section_color
    FROM musicians m
    JOIN instruments i ON i.id = m.instrument_id
    LEFT JOIN sections s ON s.id = i.section_id
    ORDER BY m.last_name ASC, m.first_name ASC
  `).all();
  return rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    color: row.color,
    email: row.email,
    phone: row.phone,
    instrumentId: row.instrument_id,
    instrument: {
      id: row.instrument_id,
      name: row.instrument_name,
      color: row.instrument_color,
      sectionId: row.section_id ?? null,
      section: row.section_id ? { id: row.section_id, name: row.section_name, color: row.section_color } : null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const getStatuses = () => {
  const rows = db.prepare(`
    SELECT id, label, color, is_default, created_at, updated_at
    FROM attendance_statuses
    ORDER BY is_default DESC, label ASC
  `).all();

  const desired = [
    { label: 'Présent', color: '#16a34a', is_default: 1 },
    { label: 'Absent', color: '#ef4444', is_default: 0 },
    { label: 'Peut-être', color: '#f59e0b', is_default: 0 },
  ];
  const existing = new Map(rows.map((r) => [r.label, r]));
  const insert = db.prepare('INSERT OR IGNORE INTO attendance_statuses (label, color, is_default, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))');
  desired.forEach((s) => insert.run(s.label, s.color, s.is_default));

  const finalRows = db.prepare(`
    SELECT id, label, color, is_default, created_at, updated_at
    FROM attendance_statuses
    WHERE label IN ('Présent','Absent','Peut-être')
    ORDER BY CASE label WHEN 'Présent' THEN 1 WHEN 'Absent' THEN 2 WHEN 'Peut-être' THEN 3 ELSE 4 END
  `).all();

  return finalRows.map((row) => ({
    id: row.id,
    label: row.label,
    color: row.color,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const getEvents = () => {
  const events = db.prepare(`
    SELECT id, title, description, date, location, price, organizer, setlist, created_at, updated_at
    FROM events
    ORDER BY date ASC
  `).all();
  if (!events.length) return [];
  const eventIds = events.map((e) => e.id);
  const placeholders = eventIds.map(() => '?').join(',');

  const assignments = db.prepare(`
    SELECT em.id AS assignment_id, em.event_id, em.musician_id, em.is_required, em.notes,
           m.id AS m_id, m.first_name, m.last_name, m.color AS m_color, m.email, m.phone, m.instrument_id,
           i.id AS i_id, i.name AS i_name, i.color AS i_color, i.section_id,
           s.id AS s_id, s.name AS s_name, s.color AS s_color
    FROM event_musicians em
    JOIN musicians m ON m.id = em.musician_id
    JOIN instruments i ON i.id = m.instrument_id
    LEFT JOIN sections s ON s.id = i.section_id
    WHERE em.event_id IN (${placeholders})
    ORDER BY m.last_name ASC, m.first_name ASC
  `).all(...eventIds);

  const presences = db.prepare(`
    SELECT p.id AS presence_id, p.event_id, p.musician_id, p.status_id, p.comment, p.responded_at,
           st.id AS st_id, st.label AS st_label, st.color AS st_color, st.is_default AS st_is_default,
           m.id AS m_id, m.first_name, m.last_name, m.color AS m_color, m.email, m.phone, m.instrument_id,
           i.id AS i_id, i.name AS i_name, i.color AS i_color, i.section_id,
           s.id AS s_id, s.name AS s_name, s.color AS s_color
    FROM presences p
    JOIN attendance_statuses st ON st.id = p.status_id
    JOIN musicians m ON m.id = p.musician_id
    JOIN instruments i ON i.id = m.instrument_id
    LEFT JOIN sections s ON s.id = i.section_id
    WHERE p.event_id IN (${placeholders})
  `).all(...eventIds);

  const eventsById = {};
  events.forEach((row) => {
    eventsById[row.id] = {
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      location: row.location,
      price: row.price,
      organizer: row.organizer,
      setlist: row.setlist,
      assignments: [],
      presences: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  for (const row of assignments) {
    const eventId = row.event_id;
    if (!eventsById[eventId]) continue;
    const instrument = {
      id: row.i_id,
      name: row.i_name,
      color: row.i_color,
      sectionId: row.section_id ?? null,
      section: row.section_id ? { id: row.section_id, name: row.s_name, color: row.s_color } : null,
    };
    const musician = {
      id: row.m_id,
      firstName: row.first_name,
      lastName: row.last_name,
      color: row.m_color,
      email: row.email,
      phone: row.phone,
      instrumentId: row.instrument_id,
      instrument,
    };
    eventsById[eventId].assignments.push({
      id: row.assignment_id,
      eventId,
      musicianId: row.musician_id,
      isRequired: !!row.is_required,
      notes: row.notes,
      musician,
    });
  }

  for (const row of presences) {
    const eventId = row.event_id;
    if (!eventsById[eventId]) continue;
    const instrument = {
      id: row.i_id,
      name: row.i_name,
      color: row.i_color,
      sectionId: row.section_id ?? null,
      section: row.section_id ? { id: row.section_id, name: row.s_name, color: row.s_color } : null,
    };
    const musician = {
      id: row.m_id,
      firstName: row.first_name,
      lastName: row.last_name,
      color: row.m_color,
      email: row.email,
      phone: row.phone,
      instrumentId: row.instrument_id,
      instrument,
    };
    const status = {
      id: row.st_id,
      label: row.st_label,
      color: row.st_color,
      isDefault: !!row.st_is_default,
    };
    eventsById[eventId].presences.push({
      id: row.presence_id,
      eventId,
      musicianId: row.musician_id,
      statusId: row.status_id,
      comment: row.comment,
      respondedAt: row.responded_at,
      musician,
      status,
    });
  }

  return Object.values(eventsById);
};

const generateIcal = (events) => {
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Fanfare//FR',
  ];

  events.forEach((event) => {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@openfanfare`);
    lines.push(`DTSTAMP:${fmt(new Date())}`);
    lines.push(`DTSTART:${fmt(start)}`);
    lines.push(`DTEND:${fmt(end)}`);
    lines.push(`SUMMARY:${esc(event.title)}`);
    if (event.location) lines.push(`LOCATION:${esc(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const renderPage = (res, view, data, req) => {
  const baseUrlForReq = (p = '') => baseUrl(p, req);
  res.render(view, {
    ...data,
    request: req,
    helpers: { h, baseUrl: baseUrlForReq, formatDatetimeLocal, formatDateFr, markdownToHtml, raw, escapeHtml },
  });
};

// Routes
app.get(`${BASE_URL}/`, (req, res) => {
  const events = getEvents();
  const statuses = getStatuses();
  const musicians = getMusicians();
  renderPage(res, 'public_events', { path: '/', events, statuses, musicians, flash: null }, req);
});

app.post(`${BASE_URL}/presence`, (req, res) => {
  const eventId = Number(req.body.event_id || 0);
  const musicianId = Number(req.body.musician_id || 0);
  const statusId = Number(req.body.status_id || 0);
  const comment = req.body.comment || null;
  if (!eventId || !musicianId || !statusId) {
    return res.redirect(baseUrl('/'));
  }
  const existing = db.prepare('SELECT id FROM presences WHERE event_id = ? AND musician_id = ?').get(eventId, musicianId);
  if (existing) {
    db.prepare('UPDATE presences SET status_id = ?, comment = ?, responded_at = datetime(\'now\') WHERE id = ?').run(statusId, comment, existing.id);
  } else {
    db.prepare('INSERT INTO presences (event_id, musician_id, status_id, comment, responded_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(eventId, musicianId, statusId, comment);
  }
  res.redirect(baseUrl('/'));
});

app.get(`${BASE_URL}/agenda`, (req, res) => {
  const events = getEvents();
  const statuses = getStatuses();
  renderPage(res, 'agenda', { path: '/agenda', events, statuses, flash: null }, req);
});

app.get(`${BASE_URL}/stats`, (req, res) => {
  const events = getEvents();
  const instruments = getInstruments();
  renderPage(res, 'stats', { path: '/stats', events, instruments, flash: null }, req);
});

app.get(`${BASE_URL}/ical`, (req, res) => {
  const events = getEvents();
  const ical = generateIcal(events);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="concerts-fanfare.ics"');
  res.send(ical);
});

app.get(`${BASE_URL}/admin`, (req, res) => {
  const events = getEvents();
  const sections = getSections();
  const instruments = getInstruments();
  const musicians = getMusicians();
  renderPage(res, 'admin', { path: '/admin', events, sections, instruments, musicians, flash: null }, req);
});

app.post(`${BASE_URL}/admin`, upload.none(), (req, res) => {
  const action = req.body.action || '';
  try {
    switch (action) {
      case 'section_save': {
        const id = Number(req.body.id || 0);
        const name = String(req.body.name || '').trim();
        const color = normalizeHexColor(req.body.color || null);
        if (!name) break;
        if (id) {
          db.prepare('UPDATE sections SET name = ?, color = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, color, id);
        } else {
          db.prepare('INSERT INTO sections (name, color, created_at, updated_at) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))').run(name, color);
        }
        break;
      }
      case 'section_delete': {
        const id = Number(req.body.id || 0);
        if (id) db.prepare('DELETE FROM sections WHERE id = ?').run(id);
        break;
      }
      case 'instrument_save': {
        const id = Number(req.body.id || 0);
        const name = String(req.body.name || '').trim();
        const color = normalizeHexColor(req.body.color || null);
        const sectionId = req.body.section_id ? Number(req.body.section_id) : null;
        if (!name) break;
        if (id) {
          db.prepare('UPDATE instruments SET name = ?, color = ?, section_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, color, sectionId, id);
        } else {
          db.prepare('INSERT INTO instruments (name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))').run(name, color, sectionId);
        }
        break;
      }
      case 'instrument_delete': {
        const id = Number(req.body.id || 0);
        if (id) db.prepare('DELETE FROM instruments WHERE id = ?').run(id);
        break;
      }
      case 'musician_save': {
        const id = Number(req.body.id || 0);
        const firstName = String(req.body.first_name || '').trim();
        const lastName = String(req.body.last_name || '').trim();
        const instrumentId = Number(req.body.instrument_id || 0);
        const color = normalizeHexColor(req.body.color || null);
        const email = req.body.email || null;
        const phone = req.body.phone || null;
        if (!firstName || !lastName || !instrumentId) break;
        if (id) {
          db.prepare('UPDATE musicians SET first_name = ?, last_name = ?, instrument_id = ?, color = ?, email = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .run(firstName, lastName, instrumentId, color, email, phone, id);
        } else {
          db.prepare('INSERT INTO musicians (first_name, last_name, instrument_id, color, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))')
            .run(firstName, lastName, instrumentId, color, email, phone);
        }
        break;
      }
      case 'musician_delete': {
        const id = Number(req.body.id || 0);
        if (id) db.prepare('DELETE FROM musicians WHERE id = ?').run(id);
        break;
      }
      case 'event_save': {
        const id = Number(req.body.id || 0);
        const title = String(req.body.title || '').trim();
        const dateInput = String(req.body.date || '').trim();
        const description = req.body.description || null;
        const location = req.body.location || null;
        const price = req.body.price || null;
        const organizer = req.body.organizer || null;
        const setlist = req.body.setlist || null;
        if (!title || !dateInput) break;
        const date = new Date(dateInput);
        const iso = isNaN(date.getTime()) ? dateInput : date.toISOString();
        if (id) {
          db.prepare('UPDATE events SET title = ?, description = ?, date = ?, location = ?, price = ?, organizer = ?, setlist = ?, updated_at = datetime(\'now\') WHERE id = ?')
            .run(title, description, iso, location, price, organizer, setlist, id);
          db.prepare('DELETE FROM event_musicians WHERE event_id = ?').run(id);
          const musicianIds = db.prepare('SELECT id FROM musicians').all();
          const insert = db.prepare('INSERT INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, 1)');
          musicianIds.forEach((m) => insert.run(id, m.id));
        } else {
          const info = db.prepare('INSERT INTO events (title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))')
            .run(title, description, iso, location, price, organizer, setlist);
          const eventId = info.lastInsertRowid;
          const musicianIds = db.prepare('SELECT id FROM musicians').all();
          const insert = db.prepare('INSERT INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, 1)');
          musicianIds.forEach((m) => insert.run(eventId, m.id));
        }
        break;
      }
      case 'event_delete': {
        const id = Number(req.body.id || 0);
        if (id) db.prepare('DELETE FROM events WHERE id = ?').run(id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(e);
  }
  res.redirect(baseUrl('/admin'));
});

app.post(`${BASE_URL}/admin/import`, upload.single('json_file'), (req, res) => {
  if (!req.file) return res.redirect(baseUrl('/admin'));
  const json = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
  fs.unlinkSync(req.file.path);
  importJson(json);
  res.redirect(baseUrl('/admin'));
});

app.post(`${BASE_URL}/admin/clear`, (req, res) => {
  clearAll();
  res.redirect(baseUrl('/admin'));
});

app.get(`${BASE_URL}/admin/export`, (req, res) => {
  const data = exportJson();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="openfanfare-export.json"');
  res.send(JSON.stringify(data, null, 2));
});

app.get(`${BASE_URL}/admin/export/musicians`, (req, res) => {
  const rows = db.prepare(`
    SELECT m.last_name, m.first_name, i.name AS instrument, m.email, m.phone
    FROM musicians m
    JOIN instruments i ON i.id = m.instrument_id
    ORDER BY m.last_name ASC, m.first_name ASC
  `).all();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="musiciens-export.csv"');
  res.write('nom;prenom;instrument;mail;telephone\n');
  rows.forEach((r) => {
    res.write(`${r.last_name};${r.first_name};${r.instrument};${r.email ?? ''};${r.phone ?? ''}\n`);
  });
  res.end();
});

app.get(`${BASE_URL}/admin/export/instruments`, (req, res) => {
  const rows = db.prepare(`
    SELECT i.name, i.color, s.name AS section
    FROM instruments i
    LEFT JOIN sections s ON s.id = i.section_id
    ORDER BY i.name ASC
  `).all();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="instruments-export.csv"');
  res.write('nom;couleur;section\n');
  rows.forEach((r) => {
    res.write(`${r.name};${r.color ?? ''};${r.section ?? ''}\n`);
  });
  res.end();
});

app.get(`${BASE_URL}/admin/export/events`, (req, res) => {
  const rows = db.prepare(`
    SELECT title, description, date, location, price, organizer, setlist
    FROM events
    ORDER BY date ASC
  `).all();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="concerts-export.csv"');
  res.write('titre;description;date;lieu;tarif;organisateur;setlist\n');
  rows.forEach((r) => {
    res.write(`${r.title};${r.description ?? ''};${r.date};${r.location ?? ''};${r.price ?? ''};${r.organizer ?? ''};${r.setlist ?? ''}\n`);
  });
  res.end();
});

app.post(`${BASE_URL}/admin/import/events`, upload.single('event_csv'), (req, res) => {
  if (!req.file) return res.redirect(baseUrl('/admin'));
  const content = fs.readFileSync(req.file.path, 'utf8');
  fs.unlinkSync(req.file.path);
  const rows = parse(content, { delimiter: ';', from_line: 2, relax_quotes: true });
  const insert = db.prepare('INSERT INTO events (title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))');
  const update = db.prepare('UPDATE events SET description = ?, location = ?, price = ?, organizer = ?, setlist = ?, updated_at = datetime(\'now\') WHERE id = ?');
  const find = db.prepare('SELECT id FROM events WHERE title = ? AND date = ?');
  const assignAll = db.prepare('INSERT OR IGNORE INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, 1)');
  const allMusicians = db.prepare('SELECT id FROM musicians').all();

  rows.forEach((row) => {
    const [titleRaw, descriptionRaw, dateRaw, locationRaw, priceRaw, organizerRaw, setlistRaw] = row.map((v) => (v ?? '').trim());
    const title = decodeHtmlEntities(titleRaw);
    const description = decodeHtmlEntities(descriptionRaw);
    const date = dateRaw;
    const location = decodeHtmlEntities(locationRaw);
    const price = decodeHtmlEntities(priceRaw);
    const organizer = decodeHtmlEntities(organizerRaw);
    const setlist = decodeHtmlEntities(setlistRaw);
    if (!title || !date) return;
    const existing = find.get(title, date);
    if (existing) {
      update.run(description || null, location || null, price || null, organizer || null, setlist || null, existing.id);
    } else {
      const info = insert.run(title, description || null, date, location || null, price || null, organizer || null, setlist || null);
      allMusicians.forEach((m) => assignAll.run(info.lastInsertRowid, m.id));
    }
  });
  res.redirect(baseUrl('/admin'));
});

app.post(`${BASE_URL}/admin/import/musicians`, upload.single('csv_file'), (req, res) => {
  if (!req.file) return res.redirect(baseUrl('/admin'));
  const content = fs.readFileSync(req.file.path, 'utf8');
  fs.unlinkSync(req.file.path);
  const rows = parse(content, { delimiter: ';', from_line: 2, relax_quotes: true });
  const getInstrument = db.prepare('SELECT id, color FROM instruments WHERE name = ?');
  const insertInstrument = db.prepare('INSERT INTO instruments (name, color, created_at, updated_at) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))');
  const updateInstrument = db.prepare('UPDATE instruments SET color = ?, updated_at = datetime(\'now\') WHERE id = ?');
  const findMusician = db.prepare('SELECT id FROM musicians WHERE first_name = ? AND last_name = ?');
  const updateMusician = db.prepare('UPDATE musicians SET instrument_id = ?, email = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?');
  const insertMusician = db.prepare('INSERT INTO musicians (first_name, last_name, instrument_id, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))');

  rows.forEach((row) => {
    const [lastNameRaw, firstNameRaw, instrumentNameRaw, emailRaw, phoneRaw] = row.map((v) => (v ?? '').trim());
    const lastName = decodeHtmlEntities(lastNameRaw);
    const firstName = decodeHtmlEntities(firstNameRaw);
    const instrumentName = decodeHtmlEntities(instrumentNameRaw);
    const email = emailRaw || null;
    const phone = phoneRaw || null;
    if (!lastName || !firstName || !instrumentName) return;
    let instrument = getInstrument.get(instrumentName);
    let instrumentId;
    if (!instrument) {
      const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
      const info = insertInstrument.run(instrumentName, color);
      instrumentId = info.lastInsertRowid;
    } else {
      instrumentId = instrument.id;
      if (!instrument.color) {
        const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
        updateInstrument.run(color, instrumentId);
      }
    }
    const existing = findMusician.get(firstName, lastName);
    if (existing) {
      updateMusician.run(instrumentId, email, phone, existing.id);
    } else {
      insertMusician.run(firstName, lastName, instrumentId, email, phone);
    }
  });
  res.redirect(baseUrl('/admin'));
});

app.post(`${BASE_URL}/admin/import/instruments`, upload.single('instrument_csv'), (req, res) => {
  if (!req.file) return res.redirect(baseUrl('/admin'));
  const content = fs.readFileSync(req.file.path, 'utf8');
  fs.unlinkSync(req.file.path);
  const rows = parse(content, { delimiter: ';', from_line: 2, relax_quotes: true });
  const getSection = db.prepare('SELECT id FROM sections WHERE name = ?');
  const insertSection = db.prepare('INSERT INTO sections (name, color, created_at, updated_at) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))');
  const findInstrument = db.prepare('SELECT id FROM instruments WHERE name = ?');
  const insertInstrument = db.prepare('INSERT INTO instruments (name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))');
  const updateInstrument = db.prepare('UPDATE instruments SET color = COALESCE(?, color), section_id = ?, updated_at = datetime(\'now\') WHERE id = ?');

  rows.forEach((row) => {
    const [nameRaw, colorRaw, sectionRaw] = row.map((v) => (v ?? '').trim());
    const name = decodeHtmlEntities(nameRaw);
    const sectionName = decodeHtmlEntities(sectionRaw);
    if (!name) return;
    const color = normalizeHexColor(colorRaw);
    let sectionId = null;
    if (sectionName) {
      const section = getSection.get(sectionName);
      if (!section) {
        const sColor = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
        sectionId = insertSection.run(sectionName, sColor).lastInsertRowid;
      } else {
        sectionId = section.id;
      }
    }
    const existing = findInstrument.get(name);
    if (existing) {
      updateInstrument.run(color, sectionId, existing.id);
    } else {
      const colorFinal = color || `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
      insertInstrument.run(name, colorFinal, sectionId);
    }
  });
  res.redirect(baseUrl('/admin'));
});

function exportJson() {
  return {
    sections: db.prepare('SELECT * FROM sections ORDER BY id').all(),
    instruments: db.prepare('SELECT * FROM instruments ORDER BY id').all(),
    musicians: db.prepare('SELECT * FROM musicians ORDER BY id').all(),
    events: db.prepare('SELECT * FROM events ORDER BY id').all(),
    attendance_statuses: db.prepare('SELECT * FROM attendance_statuses ORDER BY id').all(),
    event_musicians: db.prepare('SELECT * FROM event_musicians ORDER BY id').all(),
    presences: db.prepare('SELECT * FROM presences ORDER BY id').all(),
  };
}

function clearAll() {
  const tables = ['presences', 'event_musicians', 'attendance_statuses', 'events', 'musicians', 'instruments', 'sections'];
  const trx = db.transaction(() => {
    tables.forEach((t) => db.prepare(`DELETE FROM ${t}`).run());
  });
  trx();
}

function importJson(data) {
  const trx = db.transaction(() => {
    clearAll();
    const insertSection = db.prepare('INSERT INTO sections (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    const insertInstrument = db.prepare('INSERT INTO instruments (id, name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMusician = db.prepare('INSERT INTO musicians (id, first_name, last_name, color, email, phone, instrument_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertEvent = db.prepare('INSERT INTO events (id, title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertStatus = db.prepare('INSERT INTO attendance_statuses (id, label, color, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insertAssignment = db.prepare('INSERT INTO event_musicians (id, event_id, musician_id, is_required, notes) VALUES (?, ?, ?, ?, ?)');
    const insertPresence = db.prepare('INSERT INTO presences (id, event_id, musician_id, status_id, comment, responded_at) VALUES (?, ?, ?, ?, ?, ?)');

    (data.sections || []).forEach((row) => {
      insertSection.run(
        row.id,
        decodeHtmlEntities(row.name),
        row.color || null,
        row.created_at || row.createdAt || new Date().toISOString(),
        row.updated_at || row.updatedAt || new Date().toISOString()
      );
    });
    (data.instruments || []).forEach((row) => {
      insertInstrument.run(
        row.id,
        decodeHtmlEntities(row.name),
        row.color || null,
        row.section_id ?? row.sectionId ?? null,
        row.created_at || row.createdAt || new Date().toISOString(),
        row.updated_at || row.updatedAt || new Date().toISOString()
      );
    });
    (data.musicians || []).forEach((row) => {
      insertMusician.run(
        row.id,
        decodeHtmlEntities(row.first_name || row.firstName),
        decodeHtmlEntities(row.last_name || row.lastName),
        row.color || null,
        row.email || null,
        row.phone || null,
        row.instrument_id || row.instrumentId,
        row.created_at || row.createdAt || new Date().toISOString(),
        row.updated_at || row.updatedAt || new Date().toISOString()
      );
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
  });
  trx();
}

// Import JSON at first run if provided
if (process.env.IMPORT_JSON_PATH && fs.existsSync(process.env.IMPORT_JSON_PATH)) {
  const json = JSON.parse(fs.readFileSync(process.env.IMPORT_JSON_PATH, 'utf8'));
  importJson(json);
}

app.listen(PORT, () => {
  console.log(`Open Fanfare Node running on http://localhost:${PORT}${BASE_URL}`);
});
