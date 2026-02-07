<?php

require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/auth.php';
require_once __DIR__ . '/../app/render.php';
require_once __DIR__ . '/../app/data.php';
require_once __DIR__ . '/../app/ical.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if (defined('BASE_URL') && BASE_URL !== '' && str_starts_with($path, BASE_URL)) {
    $path = substr($path, strlen(BASE_URL));
    if ($path === '') {
        $path = '/';
    }
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($path === '/login') {
    if (is_app_authenticated()) {
        redirect('/');
    }
    if ($method === 'POST') {
        $password = request_string('password');
        if (login_app($password)) {
            redirect('/');
        }
        set_flash('error', 'Mot de passe incorrect.');
        redirect('/login');
    }
    render('auth', ['path' => $path, 'isAuthenticated' => false, 'flash' => get_flash()]);
    exit;
}

if ($path === '/logout' && $method === 'POST') {
    logout_all();
    redirect('/login');
}

require_app_login();

if ($path === '/admin/export' && $method === 'GET') {
    require_admin_login();
    $data = [
        'sections' => db_all('SELECT * FROM sections ORDER BY id'),
        'instruments' => db_all('SELECT * FROM instruments ORDER BY id'),
        'musicians' => db_all('SELECT * FROM musicians ORDER BY id'),
        'events' => db_all('SELECT * FROM events ORDER BY id'),
        'attendance_statuses' => db_all('SELECT * FROM attendance_statuses ORDER BY id'),
        'event_musicians' => db_all('SELECT * FROM event_musicians ORDER BY id'),
        'presences' => db_all('SELECT * FROM presences ORDER BY id'),
    ];
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="openfanfare-export.json"');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($path === '/admin/export/musicians' && $method === 'GET') {
    require_admin_login();
    $rows = db_all(
        'SELECT m.last_name, m.first_name, i.name AS instrument, m.email, m.phone
         FROM musicians m
         JOIN instruments i ON i.id = m.instrument_id
         ORDER BY m.last_name ASC, m.first_name ASC'
    );
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="musiciens-export.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, "\xEF\xBB\xBF");
    fputcsv($out, ['nom', 'prenom', 'instrument', 'mail', 'telephone'], ';');
    foreach ($rows as $row) {
        fputcsv($out, [$row['last_name'], $row['first_name'], $row['instrument'], $row['email'], $row['phone']], ';');
    }
    fclose($out);
    exit;
}

if ($path === '/admin/export/instruments' && $method === 'GET') {
    require_admin_login();
    $rows = db_all(
        'SELECT i.name, i.color, s.name AS section
         FROM instruments i
         LEFT JOIN sections s ON s.id = i.section_id
         ORDER BY i.name ASC'
    );
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="instruments-export.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, "\xEF\xBB\xBF");
    fputcsv($out, ['nom', 'couleur', 'section'], ';');
    foreach ($rows as $row) {
        fputcsv($out, [$row['name'], $row['color'], $row['section']], ';');
    }
    fclose($out);
    exit;
}

if ($path === '/admin/export/events' && $method === 'GET') {
    require_admin_login();
    $rows = db_all(
        'SELECT title, description, date, location, price, organizer, setlist
         FROM events
         ORDER BY date ASC'
    );
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="concerts-export.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, "\xEF\xBB\xBF");
    fputcsv($out, ['titre', 'description', 'date', 'lieu', 'tarif', 'organisateur', 'setlist'], ';');
    foreach ($rows as $row) {
        fputcsv($out, [
            $row['title'],
            $row['description'],
            $row['date'],
            $row['location'],
            $row['price'],
            $row['organizer'],
            $row['setlist'],
        ], ';');
    }
    fclose($out);
    exit;
}

if ($path === '/admin/import' && $method === 'POST') {
    require_admin_login();
    if (!isset($_FILES['json_file'])) {
        set_flash('error', 'Aucun fichier reçu.');
        redirect('/admin');
    }
    $file = $_FILES['json_file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        set_flash('error', 'Erreur lors du téléchargement du fichier.');
        redirect('/admin');
    }
    $payload = file_get_contents($file['tmp_name']);
    if ($payload === false) {
        set_flash('error', 'Impossible de lire le fichier.');
        redirect('/admin');
    }
    $data = json_decode($payload, true);
    if (!is_array($data)) {
        set_flash('error', 'JSON invalide.');
        redirect('/admin');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM presences');
        $pdo->exec('DELETE FROM event_musicians');
        $pdo->exec('DELETE FROM events');
        $pdo->exec('DELETE FROM musicians');
        $pdo->exec('DELETE FROM instruments');
        $pdo->exec('DELETE FROM sections');
        $pdo->exec('DELETE FROM attendance_statuses');

        $coerce = function ($value, bool $isBool = false) {
            if (is_string($value)) {
                $value = trim($value);
            }
            if ($value === '') {
                $value = null;
            }
            if ($isBool) {
                if (is_string($value)) {
                    $lower = strtolower($value);
                    if (in_array($lower, ['true', 't', '1', 'yes', 'y', 'vrai'], true)) {
                        return true;
                    }
                    if (in_array($lower, ['false', 'f', '0', 'no', 'n', 'faux'], true)) {
                        return false;
                    }
                    return null;
                }
                return (bool)$value;
            }
            return $value;
        };

        $sectionMap = [];
        foreach (($data['sections'] ?? []) as $row) {
            $pdo->prepare('INSERT INTO sections (name, color, created_at, updated_at) VALUES (?, ?, ?, ?)')
                ->execute([
                    $coerce($row['name'] ?? null),
                    $coerce($row['color'] ?? null),
                    $coerce($row['created_at'] ?? null),
                    $coerce($row['updated_at'] ?? null),
                ]);
            $sectionMap[$row['id']] = (int)$pdo->lastInsertId('sections_id_seq');
        }

        $instrumentMap = [];
        foreach (($data['instruments'] ?? []) as $row) {
            $sectionId = $row['section_id'] ?? null;
            $pdo->prepare('INSERT INTO instruments (name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([
                    $coerce($row['name'] ?? null),
                    $coerce($row['color'] ?? null),
                    $sectionId && isset($sectionMap[$sectionId]) ? $sectionMap[$sectionId] : null,
                    $coerce($row['created_at'] ?? null),
                    $coerce($row['updated_at'] ?? null),
                ]);
            $instrumentMap[$row['id']] = (int)$pdo->lastInsertId('instruments_id_seq');
        }

        $musicianMap = [];
        foreach (($data['musicians'] ?? []) as $row) {
            $instrumentId = $row['instrument_id'] ?? null;
            $pdo->prepare('INSERT INTO musicians (first_name, last_name, color, email, phone, instrument_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([
                    $coerce($row['first_name'] ?? null),
                    $coerce($row['last_name'] ?? null),
                    $coerce($row['color'] ?? null),
                    $coerce($row['email'] ?? null),
                    $coerce($row['phone'] ?? null),
                    $instrumentId && isset($instrumentMap[$instrumentId]) ? $instrumentMap[$instrumentId] : null,
                    $coerce($row['created_at'] ?? null),
                    $coerce($row['updated_at'] ?? null),
                ]);
            $musicianMap[$row['id']] = (int)$pdo->lastInsertId('musicians_id_seq');
        }

        $eventMap = [];
        foreach (($data['events'] ?? []) as $row) {
            $pdo->prepare('INSERT INTO events (title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([
                    $coerce($row['title'] ?? null),
                    $coerce($row['description'] ?? null),
                    $coerce($row['date'] ?? null),
                    $coerce($row['location'] ?? null),
                    $coerce($row['price'] ?? null),
                    $coerce($row['organizer'] ?? null),
                    $coerce($row['setlist'] ?? null),
                    $coerce($row['created_at'] ?? null),
                    $coerce($row['updated_at'] ?? null),
                ]);
            $eventMap[$row['id']] = (int)$pdo->lastInsertId('events_id_seq');
        }

        $statusMap = [];
        foreach (($data['attendance_statuses'] ?? []) as $row) {
            $pdo->prepare('INSERT INTO attendance_statuses (label, color, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([
                    $coerce($row['label'] ?? null),
                    $coerce($row['color'] ?? null),
                    $coerce($row['is_default'] ?? null, true),
                    $coerce($row['created_at'] ?? null),
                    $coerce($row['updated_at'] ?? null),
                ]);
            $statusMap[$row['id']] = (int)$pdo->lastInsertId('attendance_statuses_id_seq');
        }

        foreach (($data['event_musicians'] ?? []) as $row) {
            $eventId = $row['event_id'] ?? null;
            $musicianId = $row['musician_id'] ?? null;
            if (!$eventId || !$musicianId) {
                continue;
            }
            $pdo->prepare('INSERT INTO event_musicians (event_id, musician_id, is_required, notes) VALUES (?, ?, ?, ?)')
                ->execute([
                    $eventMap[$eventId] ?? null,
                    $musicianMap[$musicianId] ?? null,
                    $coerce($row['is_required'] ?? null, true),
                    $coerce($row['notes'] ?? null),
                ]);
        }

        foreach (($data['presences'] ?? []) as $row) {
            $eventId = $row['event_id'] ?? null;
            $musicianId = $row['musician_id'] ?? null;
            $statusId = $row['status_id'] ?? null;
            if (!$eventId || !$musicianId || !$statusId) {
                continue;
            }
            $pdo->prepare('INSERT INTO presences (event_id, musician_id, status_id, comment, responded_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([
                    $eventMap[$eventId] ?? null,
                    $musicianMap[$musicianId] ?? null,
                    $statusMap[$statusId] ?? null,
                    $coerce($row['comment'] ?? null),
                    $coerce($row['responded_at'] ?? null),
                ]);
        }

        $pdo->commit();
        set_flash('success', 'Import JSON terminé.');
    } catch (Throwable $e) {
        $pdo->rollBack();
        set_flash('error', 'Erreur import: ' . $e->getMessage());
    }
    redirect('/admin');
}

if ($path === '/admin/clear' && $method === 'POST') {
    require_admin_login();
    try {
        db_exec('DELETE FROM presences');
        db_exec('DELETE FROM event_musicians');
        db_exec('DELETE FROM events');
        db_exec('DELETE FROM musicians');
        db_exec('DELETE FROM instruments');
        db_exec('DELETE FROM sections');
        db_exec('DELETE FROM attendance_statuses');
        set_flash('success', 'Base vidée.');
    } catch (Throwable $e) {
        set_flash('error', 'Erreur: ' . $e->getMessage());
    }
    redirect('/admin');
}

if ($path === '/ical' && $method === 'GET') {
    $events = get_events();
    $ical = generate_ical($events);
    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename=\"concerts-fanfare.ics\"');
    echo $ical;
    exit;
}

if ($path === '/presence' && $method === 'POST') {
    $eventId = request_int('event_id');
    $statusId = request_int('status_id');
    $comment = request_nullable('comment');
    $musicianId = request_int('musician_id');
    $firstName = request_string('first_name');
    $lastName = request_string('last_name');

    if (!$eventId || !$statusId) {
        set_flash('error', 'Informations manquantes pour enregistrer la présence.');
        redirect('/');
    }

    if (!$musicianId) {
        if ($firstName === '' || $lastName === '') {
            set_flash('error', "Merci de fournir l'identifiant du musicien OU son prénom et nom.");
            redirect('/');
        }
        $musician = db_one(
            'SELECT id FROM musicians WHERE first_name = ? AND last_name = ? LIMIT 1',
            [$firstName, $lastName]
        );
        if (!$musician) {
            set_flash('error', "Musicien introuvable. Merci de contacter l'administration.");
            redirect('/');
        }
        $musicianId = (int)$musician['id'];
    }

    $existing = db_one('SELECT id FROM presences WHERE event_id = ? AND musician_id = ?', [$eventId, $musicianId]);
    if ($existing) {
        db_exec(
            'UPDATE presences SET status_id = ?, comment = ?, responded_at = NOW() WHERE id = ?',
            [$statusId, $comment, $existing['id']]
        );
    } else {
        db_exec(
            'INSERT INTO presences (event_id, musician_id, status_id, comment, responded_at) VALUES (?, ?, ?, ?, NOW())',
            [$eventId, $musicianId, $statusId, $comment]
        );
    }

    set_flash('success', 'Présence enregistrée.');
    redirect('/');
}

if ($path === '/admin/logout' && $method === 'POST') {
    logout_admin();
    redirect('/admin');
}

if ($path === '/admin' && $method === 'POST' && !is_admin_authenticated()) {
    $password = request_string('password');
    if (login_admin($password)) {
        redirect('/admin');
    }
    set_flash('error', 'Mot de passe administrateur incorrect.');
    redirect('/admin');
}

if ($path === '/admin' && $method === 'POST' && is_admin_authenticated()) {
    $action = request_string('action');

    try {
        switch ($action) {
        case 'section_save':
            $id = request_int('id');
            $name = request_string('name');
            $color = normalize_hex_color(request_nullable('color'));
            if ($name === '') {
                set_flash('error', 'Le nom du pupitre est requis.');
                break;
            }
            if ($id) {
                db_exec('UPDATE sections SET name = ?, color = ?, updated_at = NOW() WHERE id = ?', [$name, $color, $id]);
                set_flash('success', 'Pupitre mis à jour.');
            } else {
                db_exec('INSERT INTO sections (name, color, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [$name, $color]);
                set_flash('success', 'Pupitre créé.');
            }
            break;
        case 'section_delete':
            $id = request_int('id');
            if ($id) {
                db_exec('DELETE FROM sections WHERE id = ?', [$id]);
                set_flash('success', 'Pupitre supprimé.');
            }
            break;
        case 'instrument_save':
            $id = request_int('id');
            $name = request_string('name');
            $color = normalize_hex_color(request_nullable('color'));
            $sectionId = request_int('section_id');
            if ($name === '') {
                set_flash('error', "Le nom de l'instrument est requis.");
                break;
            }
            if ($id) {
                db_exec('UPDATE instruments SET name = ?, color = ?, section_id = ?, updated_at = NOW() WHERE id = ?', [$name, $color, $sectionId, $id]);
                set_flash('success', 'Instrument mis à jour.');
            } else {
                db_exec('INSERT INTO instruments (name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [$name, $color, $sectionId]);
                set_flash('success', 'Instrument créé.');
            }
            break;
        case 'instrument_delete':
            $id = request_int('id');
            if ($id) {
                db_exec('DELETE FROM instruments WHERE id = ?', [$id]);
                set_flash('success', 'Instrument supprimé.');
            }
            break;
        case 'musician_save':
            $id = request_int('id');
            $firstName = request_string('first_name');
            $lastName = request_string('last_name');
            $instrumentId = request_int('instrument_id');
            $color = normalize_hex_color(request_nullable('color'));
            $email = request_nullable('email');
            $phone = request_nullable('phone');
            if ($firstName === '' || $lastName === '' || !$instrumentId) {
                set_flash('error', 'Prénom, nom et instrument sont requis.');
                break;
            }
            if ($id) {
                db_exec('UPDATE musicians SET first_name = ?, last_name = ?, instrument_id = ?, color = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?', [$firstName, $lastName, $instrumentId, $color, $email, $phone, $id]);
                set_flash('success', 'Musicien mis à jour.');
            } else {
                db_exec('INSERT INTO musicians (first_name, last_name, instrument_id, color, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())', [$firstName, $lastName, $instrumentId, $color, $email, $phone]);
                set_flash('success', 'Musicien créé.');
            }
            break;
        case 'musician_delete':
            $id = request_int('id');
            if ($id) {
                db_exec('DELETE FROM musicians WHERE id = ?', [$id]);
                set_flash('success', 'Musicien supprimé.');
            }
            break;
        case 'event_save':
            $id = request_int('id');
            $title = request_string('title');
            $dateInput = request_string('date');
            $description = request_nullable('description');
            $location = request_nullable('location');
            $price = request_nullable('price');
            $organizer = request_nullable('organizer');
            $setlist = request_nullable('setlist');
            if ($title === '' || $dateInput === '') {
                set_flash('error', 'Titre et date sont requis.');
                break;
            }
            $dateObj = DateTime::createFromFormat('Y-m-d\\TH:i', $dateInput) ?: new DateTime($dateInput);
            $date = $dateObj->format('c');
            if ($id) {
                db_exec(
                    'UPDATE events SET title = ?, description = ?, date = ?, location = ?, price = ?, organizer = ?, setlist = ?, updated_at = NOW() WHERE id = ?',
                    [$title, $description, $date, $location, $price, $organizer, $setlist, $id]
                );
                db_exec('DELETE FROM event_musicians WHERE event_id = ?', [$id]);
                $musicianIds = db_all('SELECT id FROM musicians');
                foreach ($musicianIds as $musician) {
                    db_exec('INSERT INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, TRUE)', [$id, $musician['id']]);
                }
                set_flash('success', 'Événement mis à jour.');
            } else {
                db_exec(
                    'INSERT INTO events (title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                    [$title, $description, $date, $location, $price, $organizer, $setlist]
                );
                $eventId = (int)db()->lastInsertId('events_id_seq');
                $musicianIds = db_all('SELECT id FROM musicians');
                foreach ($musicianIds as $musician) {
                    db_exec('INSERT INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, TRUE)', [$eventId, $musician['id']]);
                }
                set_flash('success', 'Événement créé.');
            }
            break;
        case 'event_delete':
            $id = request_int('id');
            if ($id) {
                db_exec('DELETE FROM events WHERE id = ?', [$id]);
                set_flash('success', 'Événement supprimé.');
            }
            break;
        case 'musician_import':
            if (!isset($_FILES['csv_file'])) {
                set_flash('error', 'Aucun fichier reçu.');
                break;
            }
            $file = $_FILES['csv_file'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                set_flash('error', 'Erreur lors du téléchargement du fichier.');
                break;
            }
            $handle = fopen($file['tmp_name'], 'r');
            if ($handle === false) {
                set_flash('error', 'Impossible de lire le fichier.');
                break;
            }
            $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];
            $rowIndex = 0;
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $rowIndex++;
                if ($rowIndex === 1) {
                    continue;
                }
                $row = array_map('trim', $row);
                $lastName = $row[0] ?? '';
                $firstName = $row[1] ?? '';
                $instrumentName = $row[2] ?? '';
                $email = $row[3] ?? null;
                $phone = $row[4] ?? null;
                if ($lastName === '' || $firstName === '' || $instrumentName === '') {
                    $summary['skipped'] += 1;
                    $summary['errors'][] = 'Ligne ' . $rowIndex . ': colonnes obligatoires manquantes (nom;prenom;instrument).';
                    continue;
                }
                $instrument = db_one('SELECT id, color FROM instruments WHERE name = ?', [$instrumentName]);
                if (!$instrument) {
                    $color = sprintf('#%06X', mt_rand(0, 0xFFFFFF));
                    db_exec('INSERT INTO instruments (name, color, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [$instrumentName, $color]);
                    $instrumentId = (int)db()->lastInsertId('instruments_id_seq');
                } else {
                    $instrumentId = (int)$instrument['id'];
                    if (!$instrument['color']) {
                        $color = sprintf('#%06X', mt_rand(0, 0xFFFFFF));
                        db_exec('UPDATE instruments SET color = ?, updated_at = NOW() WHERE id = ?', [$color, $instrumentId]);
                    }
                }
                $existing = db_one('SELECT id, created_at, updated_at FROM musicians WHERE first_name = ? AND last_name = ?', [$firstName, $lastName]);
                if ($existing) {
                    db_exec('UPDATE musicians SET instrument_id = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?', [$instrumentId, $email, $phone, $existing['id']]);
                    $summary['updated'] += 1;
                } else {
                    db_exec('INSERT INTO musicians (first_name, last_name, instrument_id, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [$firstName, $lastName, $instrumentId, $email, $phone]);
                    $summary['created'] += 1;
                }
            }
            fclose($handle);
            $message = sprintf('Import terminé : %d créés, %d mis à jour, %d ignorés.', $summary['created'], $summary['updated'], $summary['skipped']);
            if (!empty($summary['errors'])) {
                $message .= ' Erreurs: ' . implode(' | ', $summary['errors']);
            }
            set_flash('success', $message);
            break;
        case 'instrument_import':
            if (!isset($_FILES['instrument_csv'])) {
                set_flash('error', 'Aucun fichier reçu.');
                break;
            }
            $file = $_FILES['instrument_csv'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                set_flash('error', 'Erreur lors du téléchargement du fichier.');
                break;
            }
            $handle = fopen($file['tmp_name'], 'r');
            if ($handle === false) {
                set_flash('error', 'Impossible de lire le fichier.');
                break;
            }
            $rowIndex = 0;
            $created = 0;
            $updated = 0;
            $errors = 0;
            $generateColor = function (): string {
                return sprintf('#%06X', mt_rand(0, 0xFFFFFF));
            };
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $rowIndex++;
                if ($rowIndex == 1) {
                    continue; // header
                }
                $row = array_map('trim', $row);
                $name = $row[0] ?? '';
                $color = $row[1] ?? '';
                $sectionName = $row[2] ?? '';
                if ($name === '') {
                    $errors++;
                    continue;
                }
                $color = normalize_hex_color($color);
                $sectionId = null;
                if ($sectionName !== '') {
                    $section = db_one('SELECT id FROM sections WHERE name = ?', [$sectionName]);
                    if (!$section) {
                        db_exec('INSERT INTO sections (name, color, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [$sectionName, $generateColor()]);
                        $sectionId = (int)db()->lastInsertId('sections_id_seq');
                    } else {
                        $sectionId = (int)$section['id'];
                    }
                }
                $existing = db_one('SELECT id FROM instruments WHERE name = ?', [$name]);
                if ($existing) {
                    db_exec('UPDATE instruments SET color = COALESCE(?, color), section_id = ?, updated_at = NOW() WHERE id = ?', [$color, $sectionId, $existing['id']]);
                    $updated++;
                } else {
                    db_exec('INSERT INTO instruments (name, color, section_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())', [$name, $color ?: $generateColor(), $sectionId]);
                    $created++;
                }
            }
            fclose($handle);
            set_flash('success', "Import instruments terminé : $created créés, $updated mis à jour, $errors ignorés.");
            break;
        case 'event_import':
            if (!isset($_FILES['event_csv'])) {
                set_flash('error', 'Aucun fichier reçu.');
                break;
            }
            $file = $_FILES['event_csv'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                set_flash('error', 'Erreur lors du téléchargement du fichier.');
                break;
            }
            $handle = fopen($file['tmp_name'], 'r');
            if ($handle === false) {
                set_flash('error', 'Impossible de lire le fichier.');
                break;
            }
            $rowIndex = 0;
            $created = 0;
            $updated = 0;
            $errors = 0;
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $rowIndex++;
                if ($rowIndex === 1) {
                    continue; // header
                }
                $row = array_map('trim', $row);
                $title = $row[0] ?? '';
                $description = $row[1] ?? null;
                $date = $row[2] ?? '';
                $location = $row[3] ?? null;
                $price = $row[4] ?? null;
                $organizer = $row[5] ?? null;
                $setlist = $row[6] ?? null;
                if ($title === '' || $date === '') {
                    $errors++;
                    continue;
                }
                $existing = db_one('SELECT id FROM events WHERE title = ? AND date = ?', [$title, $date]);
                if ($existing) {
                    db_exec('UPDATE events SET description = ?, location = ?, price = ?, organizer = ?, setlist = ?, updated_at = NOW() WHERE id = ?', [$description, $location, $price, $organizer, $setlist, $existing['id']]);
                    $updated++;
                } else {
                    db_exec('INSERT INTO events (title, description, date, location, price, organizer, setlist, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', [$title, $description, $date, $location, $price, $organizer, $setlist]);
                    $eventId = (int)db()->lastInsertId('events_id_seq');
                    $musicianIds = db_all('SELECT id FROM musicians');
                    foreach ($musicianIds as $musician) {
                        db_exec('INSERT INTO event_musicians (event_id, musician_id, is_required) VALUES (?, ?, TRUE)', [$eventId, $musician['id']]);
                    }
                    $created++;
                }
            }
            fclose($handle);
            set_flash('success', "Import concerts terminé : $created créés, $updated mis à jour, $errors ignorés.");
            break;
    }
    } catch (Throwable $e) {
        set_flash('error', 'Erreur: ' . $e->getMessage());
    }

    redirect('/admin');
}

if ($path === '/agenda') {
    $events = get_events();
    $statuses = get_statuses();
    render('agenda', [
        'path' => $path,
        'events' => $events,
        'statuses' => $statuses,
        'flash' => get_flash(),
    ]);
    exit;
}

if ($path === '/stats') {
    $events = get_events();
    $instruments = get_instruments();
    render('stats', [
        'path' => $path,
        'events' => $events,
        'instruments' => $instruments,
        'flash' => get_flash(),
    ]);
    exit;
}

if ($path === '/admin') {
    if (!is_admin_authenticated()) {
        render('admin_login', [
            'path' => $path,
            'flash' => get_flash(),
            'isAuthenticated' => true,
        ]);
        exit;
    }

    $events = get_events();
    $sections = get_sections();
    $instruments = get_instruments();
    $musicians = get_musicians();

    render('admin', [
        'path' => $path,
        'events' => $events,
        'sections' => $sections,
        'instruments' => $instruments,
        'musicians' => $musicians,
        'flash' => get_flash(),
    ]);
    exit;
}

$events = get_events();
$statuses = get_statuses();
$musicians = get_musicians();
render('public_events', [
    'path' => $path,
    'events' => $events,
    'statuses' => $statuses,
    'musicians' => $musicians,
    'flash' => get_flash(),
]);
