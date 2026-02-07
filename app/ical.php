<?php

function format_ical_date(DateTime $date): string
{
    return $date->format('Ymd\THis');
}

function escape_ical_text(string $text): string
{
    $text = str_replace('\\', '\\\\', $text);
    $text = str_replace(';', '\\;', $text);
    $text = str_replace(',', '\\,', $text);
    $text = str_replace("\n", '\\n', $text);
    return $text;
}

function generate_ical(array $events): string
{
    $now = new DateTime();
    $timestamp = format_ical_date($now);

    $lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Open Fanfare//Agenda des Concerts//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Open Fanfare - Concerts',
        'X-WR-TIMEZONE:Europe/Paris',
        'X-WR-CALDESC:Calendrier des concerts de la fanfare',
    ];

    foreach ($events as $event) {
        $start = new DateTime($event['date']);
        $end = clone $start;
        $end->modify('+2 hours');

        $presentMusicians = [];
        foreach ($event['presences'] as $presence) {
            if (stripos($presence['status']['label'], 'présent') !== false) {
                $presentMusicians[] = [
                    'name' => $presence['musician']['firstName'] . ' ' . $presence['musician']['lastName'],
                    'instrument' => $presence['musician']['instrument']['name'],
                ];
            }
        }
        usort($presentMusicians, fn($a, $b) => strcmp($a['name'], $b['name']));

        $description = '';
        if (!empty($event['description'])) {
            $description .= escape_ical_text($event['description']) . '\\n\\n';
        }
        if (!empty($event['setlist'])) {
            $description .= 'SETLIST:\\n';
            $songs = array_filter(array_map('trim', explode("\n", $event['setlist'])));
            foreach ($songs as $index => $song) {
                $description .= ($index + 1) . '. ' . escape_ical_text($song) . '\\n';
            }
            $description .= '\\n';
        }
        if (!empty($event['organizer'])) {
            $description .= 'Organisateur: ' . escape_ical_text($event['organizer']) . '\\n';
        }
        if (!empty($event['price'])) {
            $description .= 'Tarif: ' . escape_ical_text($event['price']) . '\\n';
        }
        $description .= '\\nMusiciens attendus: ' . count($event['assignments']);
        if (count($presentMusicians) > 0) {
            $description .= '\\nMusiciens présents (' . count($presentMusicians) . '):\\n';
            foreach ($presentMusicians as $musician) {
                $description .= '  - ' . escape_ical_text($musician['name']) . ' (' . escape_ical_text($musician['instrument']) . ')\\n';
            }
        }

        $lines[] = 'BEGIN:VEVENT';
        $lines[] = 'UID:' . $event['id'] . '@openfanfare.local';
        $lines[] = 'DTSTAMP:' . $timestamp;
        $lines[] = 'DTSTART:' . format_ical_date($start);
        $lines[] = 'DTEND:' . format_ical_date($end);
        $lines[] = 'SUMMARY:' . escape_ical_text($event['title']);
        if ($description !== '') {
            $lines[] = 'DESCRIPTION:' . $description;
        }
        if (!empty($event['location'])) {
            $lines[] = 'LOCATION:' . escape_ical_text($event['location']);
        }
        $lines[] = 'STATUS:CONFIRMED';
        $lines[] = 'SEQUENCE:0';
        $lines[] = 'END:VEVENT';
    }

    $lines[] = 'END:VCALENDAR';
    return implode("\r\n", $lines);
}
