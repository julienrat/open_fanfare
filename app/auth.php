<?php

function auth_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $config = require __DIR__ . '/config.php';
    return $config['app'];
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function is_app_authenticated(): bool
{
    return true;
}

function is_admin_authenticated(): bool
{
    if (is_admin_basic_authenticated()) {
        return true;
    }
    $config = auth_config();
    $token = $_COOKIE['admin_token'] ?? '';
    return $token !== '' && validate_admin_token($token, $config['admin_secret'], (int)$config['admin_token_ttl']);
}

function login_app(string $password): bool
{
    $config = auth_config();
    if ($password !== '' && hash_equals($config['app_password'], $password)) {
        start_session();
        $_SESSION['app_authenticated'] = true;
        return true;
    }
    return false;
}

function login_admin(string $password): bool
{
    $config = auth_config();
    if ($password !== '' && hash_equals($config['admin_secret'], $password)) {
        $token = create_admin_token($config['admin_secret']);
        $ttl = (int)$config['admin_token_ttl'];
        $cookiePath = (defined('BASE_URL') && BASE_URL !== '') ? BASE_URL . '/' : '/';
        setcookie('admin_token', $token, [
            'expires' => time() + $ttl,
            'path' => $cookiePath,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        return true;
    }
    return false;
}

function logout_all(): void
{
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function logout_admin(): void
{
    if (isset($_COOKIE['admin_token'])) {
        $cookiePath = (defined('BASE_URL') && BASE_URL !== '') ? BASE_URL . '/' : '/';
        setcookie('admin_token', '', [
            'expires' => time() - 3600,
            'path' => $cookiePath,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

function require_app_login(): void
{
    return;
}

function require_admin_login(): void
{
    if (!is_admin_authenticated()) {
        header('WWW-Authenticate: Basic realm="Open Fanfare Admin"');
        http_response_code(401);
        echo 'Unauthorized';
        exit;
    }
}

function is_admin_basic_authenticated(): bool
{
    $config = auth_config();
    $user = $config['admin_user'] ?? 'admin';
    $secret = $config['admin_secret'] ?? '';

    $authUser = $_SERVER['PHP_AUTH_USER'] ?? null;
    $authPass = $_SERVER['PHP_AUTH_PW'] ?? null;

    if ($authUser === null && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
        if (stripos($header, 'Basic ') === 0) {
            $decoded = base64_decode(substr($header, 6), true);
            if ($decoded !== false && str_contains($decoded, ':')) {
                [$authUser, $authPass] = explode(':', $decoded, 2);
            }
        }
    }

    if ($authUser === null || $authPass === null) {
        return false;
    }
    if ($secret === '') {
        return false;
    }
    return hash_equals($user, (string)$authUser) && hash_equals($secret, (string)$authPass);
}

function create_admin_token(string $secret): string
{
    $payload = json_encode(['ts' => time()], JSON_UNESCAPED_UNICODE);
    $payload64 = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $payload64, $secret);
    return $payload64 . '.' . $sig;
}

function validate_admin_token(string $token, string $secret, int $ttl): bool
{
    if ($secret === '' || $token === '') {
        return false;
    }
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return false;
    }
    [$payload64, $sig] = $parts;
    $expected = hash_hmac('sha256', $payload64, $secret);
    if (!hash_equals($expected, $sig)) {
        return false;
    }
    $payload = json_decode(base64_decode(strtr($payload64, '-_', '+/')) ?: '', true);
    if (!is_array($payload) || !isset($payload['ts'])) {
        return false;
    }
    $ts = (int)$payload['ts'];
    if ($ttl > 0 && (time() - $ts) > $ttl) {
        return false;
    }
    return true;
}
