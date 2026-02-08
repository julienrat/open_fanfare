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
    return true;
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
    return;
}

function require_app_login(): void
{
    return;
}

function require_admin_login(): void
{
    return;
}

function is_admin_basic_authenticated(): bool
{
    $config = auth_config();
    $user = $config['admin_user'] ?? 'admin';
    $secret = (string)($config['admin_secret'] ?? '');

    $authUser = $_SERVER['PHP_AUTH_USER'] ?? null;
    $authPass = $_SERVER['PHP_AUTH_PW'] ?? null;

    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($authUser === null && $header) {
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
    if (!hash_equals($secret, (string)$authPass)) {
        return false;
    }
    if ($user === '' || $authUser === null) {
        return true;
    }
    return hash_equals($user, (string)$authUser);
}
