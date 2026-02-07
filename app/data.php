<?php

require_once __DIR__ . '/db.php';

function get_sections(): array
{
    return db_all('SELECT id, name, color, created_at, updated_at FROM sections ORDER BY name ASC');
}

function get_instruments(): array
{
    $rows = db_all(
        'SELECT i.id, i.name, i.color, i.section_id, i.created_at, i.updated_at,
                s.id AS section_id, s.name AS section_name, s.color AS section_color
         FROM instruments i
         LEFT JOIN sections s ON s.id = i.section_id
         ORDER BY i.name ASC'
    );

    $instruments = [];
    foreach ($rows as $row) {
        $instrument = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'color' => $row['color'],
            'sectionId' => $row['section_id'] !== null ? (int)$row['section_id'] : null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
            'section' => null,
        ];
        if ($row['section_id'] !== null) {
            $instrument['section'] = [
                'id' => (int)$row['section_id'],
                'name' => $row['section_name'],
                'color' => $row['section_color'],
            ];
        }
        $instruments[] = $instrument;
    }
    return $instruments;
}

function get_musicians(): array
{
    $rows = db_all(
        'SELECT m.id, m.first_name, m.last_name, m.color, m.email, m.phone, m.instrument_id, m.created_at, m.updated_at,
                i.id AS instrument_id, i.name AS instrument_name, i.color AS instrument_color, i.section_id,
                s.id AS section_id, s.name AS section_name, s.color AS section_color
         FROM musicians m
         JOIN instruments i ON i.id = m.instrument_id
         LEFT JOIN sections s ON s.id = i.section_id
         ORDER BY m.last_name ASC, m.first_name ASC'
    );

    $musicians = [];
    foreach ($rows as $row) {
        $instrument = [
            'id' => (int)$row['instrument_id'],
            'name' => $row['instrument_name'],
            'color' => $row['instrument_color'],
            'sectionId' => $row['section_id'] !== null ? (int)$row['section_id'] : null,
            'section' => null,
        ];
        if ($row['section_id'] !== null) {
            $instrument['section'] = [
                'id' => (int)$row['section_id'],
                'name' => $row['section_name'],
                'color' => $row['section_color'],
            ];
        }
        $musicians[] = [
            'id' => (int)$row['id'],
            'firstName' => $row['first_name'],
            'lastName' => $row['last_name'],
            'color' => $row['color'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'instrumentId' => (int)$row['instrument_id'],
            'instrument' => $instrument,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
    return $musicians;
}

function get_statuses(): array
{
    $desired = [
        ['label' => 'Présent', 'color' => '#16a34a', 'is_default' => true],
        ['label' => 'Absent', 'color' => '#ef4444', 'is_default' => false],
        ['label' => 'Peut-être', 'color' => '#f59e0b', 'is_default' => false],
    ];

    $rows = db_all('SELECT id, label, color, is_default, created_at, updated_at FROM attendance_statuses ORDER BY is_default DESC, label ASC');
    $existing = [];
    foreach ($rows as $row) {
        $key = strtolower(trim($row['label']));
        $key = str_replace(['é', 'è', 'ê'], 'e', $key);
        $key = str_replace(['à', 'â'], 'a', $key);
        $existing[$key] = $row;
    }

    foreach ($desired as $status) {
        $key = strtolower($status['label']);
        $key = str_replace(['é', 'è', 'ê'], 'e', $key);
        $key = str_replace(['à', 'â'], 'a', $key);
        if (!isset($existing[$key])) {
            db_exec(
                'INSERT INTO attendance_statuses (label, color, is_default, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
                [$status['label'], $status['color'], (int)$status['is_default']]
            );
        }
    }

    $rows = db_all(
        'SELECT id, label, color, is_default, created_at, updated_at
         FROM attendance_statuses
         WHERE label IN (\'Présent\', \'Absent\', \'Peut-être\')
         ORDER BY CASE label
           WHEN \'Présent\' THEN 1
           WHEN \'Absent\' THEN 2
           WHEN \'Peut-être\' THEN 3
           ELSE 4 END'
    );

    $statuses = [];
    foreach ($rows as $row) {
        $statuses[] = [
            'id' => (int)$row['id'],
            'label' => $row['label'],
            'color' => $row['color'],
            'isDefault' => (bool)$row['is_default'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
    return $statuses;
}

function get_events(): array
{
    $events = db_all(
        'SELECT id, title, description, date, location, price, organizer, setlist, created_at, updated_at
         FROM events
         ORDER BY date ASC'
    );

    if (!$events) {
        return [];
    }

    $eventIds = array_map(fn($row) => (int)$row['id'], $events);
    $placeholders = implode(',', array_fill(0, count($eventIds), '?'));

    $assignments = db_all(
        'SELECT em.id AS assignment_id, em.event_id, em.musician_id, em.is_required, em.notes,
                m.id AS m_id, m.first_name, m.last_name, m.color AS m_color, m.email, m.phone, m.instrument_id,
                i.id AS i_id, i.name AS i_name, i.color AS i_color, i.section_id,
                s.id AS s_id, s.name AS s_name, s.color AS s_color
         FROM event_musicians em
         JOIN musicians m ON m.id = em.musician_id
         JOIN instruments i ON i.id = m.instrument_id
         LEFT JOIN sections s ON s.id = i.section_id
         WHERE em.event_id IN (' . $placeholders . ')
         ORDER BY m.last_name ASC, m.first_name ASC',
        $eventIds
    );

    $presences = db_all(
        'SELECT p.id AS presence_id, p.event_id, p.musician_id, p.status_id, p.comment, p.responded_at,
                st.id AS st_id, st.label AS st_label, st.color AS st_color, st.is_default AS st_is_default,
                m.id AS m_id, m.first_name, m.last_name, m.color AS m_color, m.email, m.phone, m.instrument_id,
                i.id AS i_id, i.name AS i_name, i.color AS i_color, i.section_id,
                s.id AS s_id, s.name AS s_name, s.color AS s_color
         FROM presences p
         JOIN attendance_statuses st ON st.id = p.status_id
         JOIN musicians m ON m.id = p.musician_id
         JOIN instruments i ON i.id = m.instrument_id
         LEFT JOIN sections s ON s.id = i.section_id
         WHERE p.event_id IN (' . $placeholders . ')',
        $eventIds
    );

    $eventsById = [];
    foreach ($events as $row) {
        $eventsById[(int)$row['id']] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'date' => $row['date'],
            'location' => $row['location'],
            'price' => $row['price'],
            'organizer' => $row['organizer'],
            'setlist' => $row['setlist'],
            'assignments' => [],
            'presences' => [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    foreach ($assignments as $row) {
        $eventId = (int)$row['event_id'];
        if (!isset($eventsById[$eventId])) {
            continue;
        }
        $instrument = [
            'id' => (int)$row['i_id'],
            'name' => $row['i_name'],
            'color' => $row['i_color'],
            'sectionId' => $row['section_id'] !== null ? (int)$row['section_id'] : null,
            'section' => null,
        ];
        if ($row['section_id'] !== null) {
            $instrument['section'] = [
                'id' => (int)$row['section_id'],
                'name' => $row['s_name'],
                'color' => $row['s_color'],
            ];
        }
        $musician = [
            'id' => (int)$row['m_id'],
            'firstName' => $row['first_name'],
            'lastName' => $row['last_name'],
            'color' => $row['m_color'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'instrumentId' => (int)$row['instrument_id'],
            'instrument' => $instrument,
        ];
        $eventsById[$eventId]['assignments'][] = [
            'id' => (int)$row['assignment_id'],
            'eventId' => $eventId,
            'musicianId' => (int)$row['musician_id'],
            'isRequired' => (bool)$row['is_required'],
            'notes' => $row['notes'],
            'musician' => $musician,
        ];
    }

    foreach ($presences as $row) {
        $eventId = (int)$row['event_id'];
        if (!isset($eventsById[$eventId])) {
            continue;
        }
        $instrument = [
            'id' => (int)$row['i_id'],
            'name' => $row['i_name'],
            'color' => $row['i_color'],
            'sectionId' => $row['section_id'] !== null ? (int)$row['section_id'] : null,
            'section' => null,
        ];
        if ($row['section_id'] !== null) {
            $instrument['section'] = [
                'id' => (int)$row['section_id'],
                'name' => $row['s_name'],
                'color' => $row['s_color'],
            ];
        }
        $musician = [
            'id' => (int)$row['m_id'],
            'firstName' => $row['first_name'],
            'lastName' => $row['last_name'],
            'color' => $row['m_color'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'instrumentId' => (int)$row['instrument_id'],
            'instrument' => $instrument,
        ];
        $status = [
            'id' => (int)$row['st_id'],
            'label' => $row['st_label'],
            'color' => $row['st_color'],
            'isDefault' => (bool)$row['st_is_default'],
        ];
        $eventsById[$eventId]['presences'][] = [
            'id' => (int)$row['presence_id'],
            'eventId' => $eventId,
            'musicianId' => (int)$row['musician_id'],
            'statusId' => (int)$row['status_id'],
            'comment' => $row['comment'],
            'respondedAt' => $row['responded_at'],
            'musician' => $musician,
            'status' => $status,
        ];
    }

    return array_values($eventsById);
}

function get_event_by_id(int $eventId): ?array
{
    $events = get_events();
    foreach ($events as $event) {
        if ($event['id'] === $eventId) {
            return $event;
        }
    }
    return null;
}
