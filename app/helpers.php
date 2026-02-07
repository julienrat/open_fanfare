<?php

function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function base_url(string $path = ''): string
{
    $base = defined('BASE_URL') ? BASE_URL : '';
    if ($path === '') {
        return $base;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    return $base . $path;
}

function redirect(string $path): void
{
    if (!preg_match('~^https?://~i', $path)) {
        $path = base_url($path);
    }
    header('Location: ' . $path);
    exit;
}

function set_flash(string $type, string $message): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function get_flash(): ?array
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!isset($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function request_string(string $key, string $default = ''): string
{
    return isset($_POST[$key]) ? trim((string)$_POST[$key]) : $default;
}

function request_int(string $key, ?int $default = null): ?int
{
    if (!isset($_POST[$key]) || $_POST[$key] === '') {
        return $default;
    }
    $value = filter_var($_POST[$key], FILTER_VALIDATE_INT);
    return $value === false ? $default : (int)$value;
}

function request_nullable(string $key): ?string
{
    if (!isset($_POST[$key])) {
        return null;
    }
    $value = trim((string)$_POST[$key]);
    return $value === '' ? null : $value;
}

function format_datetime_local(string $iso): string
{
    $date = new DateTime($iso);
    $date->setTimezone(new DateTimeZone(date_default_timezone_get()));
    return $date->format('Y-m-d\TH:i');
}

function format_date_fr(string $iso, string $format = 'd/m/Y H:i'): string
{
    $date = new DateTime($iso);
    return $date->format($format);
}

function normalize_hex_color(?string $color): ?string
{
    if ($color === null || $color === '') {
        return null;
    }
    $color = trim($color);
    if (preg_match('/^#([0-9a-fA-F]{3}){1,2}$/', $color)) {
        return $color;
    }
    return null;
}

function markdown_to_html(?string $text): string
{
    if ($text === null) {
        return '';
    }
    $lines = preg_split('/\r\n|\r|\n/', $text);
    $html = '';
    $inList = false;
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '') {
            if ($inList) {
                $html .= "</ul>\n";
                $inList = false;
            }
            continue;
        }

        $escaped = htmlspecialchars($trimmed, ENT_QUOTES, 'UTF-8');
        $escaped = preg_replace('/\\*\\*(.+?)\\*\\*/', '<strong>$1</strong>', $escaped);
        $escaped = preg_replace('/\\*(.+?)\\*/', '<em>$1</em>', $escaped);
        $escaped = preg_replace('/\\[(.+?)\\]\\((https?:\\/\\/[^\\s]+)\\)/', '<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>', $escaped);

        if (preg_match('/^#{1}\\s+(.+)/', $escaped, $matches)) {
            if ($inList) {
                $html .= "</ul>\n";
                $inList = false;
            }
            $html .= '<h4>' . $matches[1] . "</h4>\n";
            continue;
        }

        if (preg_match('/^[-*]\\s+(.+)/', $escaped, $matches)) {
            if (!$inList) {
                $html .= "<ul>\n";
                $inList = true;
            }
            $html .= '<li>' . $matches[1] . "</li>\n";
            continue;
        }

        if ($inList) {
            $html .= "</ul>\n";
            $inList = false;
        }
        $html .= '<p>' . $escaped . "</p>\n";
    }

    if ($inList) {
        $html .= "</ul>\n";
    }

    return $html;
}
