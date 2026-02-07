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
    start_session();
    return !empty($_SESSION['app_authenticated']);
}

function is_admin_authenticated(): bool
{
    start_session();
    return !empty($_SESSION['admin_authenticated']);
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
        start_session();
        $_SESSION['admin_authenticated'] = true;
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
    start_session();
    unset($_SESSION['admin_authenticated']);
}

function require_app_login(): void
{
    if (!is_app_authenticated()) {
        redirect('/login');
    }
}

function require_admin_login(): void
{
    if (!is_admin_authenticated()) {
        redirect('/admin');
    }
}
