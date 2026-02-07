<?php

function render(string $view, array $data = []): void
{
    $viewPath = __DIR__ . '/views/' . $view . '.php';
    if (!is_file($viewPath)) {
        http_response_code(500);
        echo 'Vue introuvable';
        return;
    }

    require_once __DIR__ . '/helpers.php';
    extract($data, EXTR_SKIP);
    ob_start();
    include $viewPath;
    $content = ob_get_clean();

    $data = $data;
    include __DIR__ . '/views/layout.php';
}
