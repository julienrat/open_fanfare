INSERT INTO attendance_statuses (label, color, is_default)
VALUES
  ('Présent', '#22c55e', TRUE),
  ('Absent', '#ef4444', FALSE),
  ('Peut-être', '#facc15', FALSE)
ON CONFLICT (label) DO UPDATE SET color = EXCLUDED.color, is_default = EXCLUDED.is_default;

INSERT INTO instruments (name, color)
VALUES
  ('Trompette', '#60a5fa'),
  ('Saxophone', '#f97316'),
  ('Tuba', '#a855f7')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

WITH ins AS (
  SELECT id, name FROM instruments
)
INSERT INTO musicians (first_name, last_name, email, phone, instrument_id)
VALUES
  ('Alice', 'Dupont', 'alice.dupont@example.com', '+33601020304', (SELECT id FROM ins WHERE name = 'Trompette')),
  ('Bruno', 'Martin', 'bruno.martin@example.com', '+33605060708', (SELECT id FROM ins WHERE name = 'Saxophone')),
  ('Claire', 'Durand', 'claire.durand@example.com', '+33611121314', (SELECT id FROM ins WHERE name = 'Tuba'))
ON CONFLICT (first_name, last_name) DO UPDATE
  SET email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      instrument_id = EXCLUDED.instrument_id;
