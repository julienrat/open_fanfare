<?php

function load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        [$key, $value] = $parts;
        $key = trim($key);
        $value = trim($value);
        if ($value !== '' && ($value[0] === '"' || $value[0] === '\'')) {
            $value = trim($value, "\"'");
        }
        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

load_env(__DIR__ . '/../.env');

$timezone = getenv('APP_TIMEZONE') ?: 'Europe/Paris';
@date_default_timezone_set($timezone);

$baseUrl = '';
if (isset($_SERVER['SCRIPT_NAME'])) {
    $baseUrl = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    if ($baseUrl === '.' || $baseUrl === '/') {
        $baseUrl = '';
    }
}
define('BASE_URL', $baseUrl);

function env_value(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false) {
        return $default;
    }
    return $value;
}

function parse_database_url(?string $url): ?array
{
    if (!$url) {
        return null;
    }

    $parts = parse_url($url);
    if ($parts === false || !isset($parts['scheme'])) {
        return null;
    }

    if (!in_array($parts['scheme'], ['postgres', 'postgresql', 'pgsql'], true)) {
        return null;
    }

    return [
        'host' => $parts['host'] ?? 'localhost',
        'port' => $parts['port'] ?? 5432,
        'dbname' => isset($parts['path']) ? ltrim($parts['path'], '/') : '',
        'user' => $parts['user'] ?? '',
        'pass' => $parts['pass'] ?? '',
        'sslmode' => env_value('DB_SSLMODE', 'prefer'),
    ];
}

$database = parse_database_url(env_value('DATABASE_URL'));
if ($database === null) {
    $database = [
        'host' => env_value('DB_HOST', '127.0.0.1'),
        'port' => (int)env_value('DB_PORT', '5432'),
        'dbname' => env_value('DB_NAME', 'openfanfare'),
        'user' => env_value('DB_USER', 'openfanfare'),
        'pass' => env_value('DB_PASS', ''),
        'sslmode' => env_value('DB_SSLMODE', 'prefer'),
    ];
}

return [
    'app' => [
        'name' => env_value('APP_NAME', 'Open Fanfare'),
        'timezone' => $timezone,
        'app_password' => env_value('APP_PASSWORD'),
        'admin_secret' => env_value('ADMIN_SECRET'),
        'admin_user' => env_value('ADMIN_USER', 'admin'),
        'admin_token_ttl' => (int)env_value('ADMIN_TOKEN_TTL', '604800'),
    ],
    'db' => $database,
];
