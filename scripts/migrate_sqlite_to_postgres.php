<?php

require __DIR__ . '/../app/config.php';
require __DIR__ . '/../app/db.php';

function env_or_null(string $key): ?string
{
    $value = getenv($key);
    return $value === false ? null : $value;
}

function resolve_sqlite_path(): string
{
    $path = env_or_null('SQLITE_PATH');
    if ($path && is_file($path)) {
        return $path;
    }

    $url = env_or_null('SQLITE_DATABASE_URL') ?: env_or_null('LEGACY_DATABASE_URL');
    if ($url) {
        if (str_starts_with($url, 'file:')) {
            $url = substr($url, 5);
        }
        if (is_file($url)) {
            return $url;
        }
    }

    throw new RuntimeException('Chemin SQLite introuvable. Définissez SQLITE_PATH ou SQLITE_DATABASE_URL.');
}

$sqlitePath = resolve_sqlite_path();
$sqlite = new PDO('sqlite:' . $sqlitePath);
$sqlite->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$pg = db();
$pg->beginTransaction();

$tables = [
    'sections' => [
        'source' => 'Section',
        'columns' => ['id', 'name', 'color', 'createdAt', 'updatedAt'],
        'target' => ['id', 'name', 'color', 'created_at', 'updated_at'],
    ],
    'instruments' => [
        'source' => 'Instrument',
        'columns' => ['id', 'name', 'color', 'sectionId', 'createdAt', 'updatedAt'],
        'target' => ['id', 'name', 'color', 'section_id', 'created_at', 'updated_at'],
    ],
    'musicians' => [
        'source' => 'Musician',
        'columns' => ['id', 'firstName', 'lastName', 'color', 'email', 'phone', 'instrumentId', 'createdAt', 'updatedAt'],
        'target' => ['id', 'first_name', 'last_name', 'color', 'email', 'phone', 'instrument_id', 'created_at', 'updated_at'],
    ],
    'events' => [
        'source' => 'Event',
        'columns' => ['id', 'title', 'description', 'date', 'location', 'price', 'organizer', 'setlist', 'createdAt', 'updatedAt'],
        'target' => ['id', 'title', 'description', 'date', 'location', 'price', 'organizer', 'setlist', 'created_at', 'updated_at'],
    ],
    'attendance_statuses' => [
        'source' => 'AttendanceStatus',
        'columns' => ['id', 'label', 'color', 'isDefault', 'createdAt', 'updatedAt'],
        'target' => ['id', 'label', 'color', 'is_default', 'created_at', 'updated_at'],
    ],
    'event_musicians' => [
        'source' => 'EventMusician',
        'columns' => ['id', 'eventId', 'musicianId', 'isRequired', 'notes'],
        'target' => ['id', 'event_id', 'musician_id', 'is_required', 'notes'],
    ],
    'presences' => [
        'source' => 'Presence',
        'columns' => ['id', 'eventId', 'musicianId', 'statusId', 'comment', 'respondedAt'],
        'target' => ['id', 'event_id', 'musician_id', 'status_id', 'comment', 'responded_at'],
    ],
];

try {
    foreach ($tables as $targetTable => $info) {
        $sourceTable = $info['source'];
        $sourceCols = $info['columns'];
        $targetCols = $info['target'];

        $selectSql = 'SELECT ' . implode(', ', array_map(fn($c) => '"' . $c . '"', $sourceCols)) . ' FROM "' . $sourceTable . '"';
        $rows = $sqlite->query($selectSql)->fetchAll();

        if (!$rows) {
            continue;
        }

        $placeholders = '(' . implode(', ', array_fill(0, count($targetCols), '?')) . ')';
        $insertSql = 'INSERT INTO ' . $targetTable . ' (' . implode(', ', $targetCols) . ') VALUES ' . $placeholders;
        $stmt = $pg->prepare($insertSql);

        foreach ($rows as $row) {
            $values = [];
            foreach ($sourceCols as $index => $column) {
                $values[] = $row[$column] ?? null;
            }
            $stmt->execute($values);
        }
    }

    $sequenceTables = [
        'sections',
        'instruments',
        'musicians',
        'events',
        'attendance_statuses',
        'event_musicians',
        'presences',
    ];

    foreach ($sequenceTables as $table) {
        $seq = $table . '_id_seq';
        $pg->exec("SELECT setval('" . $seq . "', COALESCE((SELECT MAX(id) FROM " . $table . "), 1), true)");
    }

    $pg->commit();
    echo "Migration terminée.\n";
} catch (Throwable $e) {
    $pg->rollBack();
    fwrite(STDERR, 'Erreur migration: ' . $e->getMessage() . "\n");
    exit(1);
}
