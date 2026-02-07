<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../auth.php';

$path = $data['path'] ?? '/';
$activePath = '/';
if (str_starts_with($path, '/admin')) {
    $activePath = '/admin';
} elseif (str_starts_with($path, '/stats')) {
    $activePath = '/stats';
} elseif (str_starts_with($path, '/agenda')) {
    $activePath = '/agenda';
}

$isAuthenticated = $data['isAuthenticated'] ?? is_app_authenticated();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Open Fanfare</title>
  <link rel="stylesheet" href="<?php echo h(base_url('/assets/css/index.css')); ?>" />
  <link rel="stylesheet" href="<?php echo h(base_url('/assets/css/app.css')); ?>" />
  <link rel="stylesheet" href="<?php echo h(base_url('/assets/css/app-login.css')); ?>" />
  <link rel="stylesheet" href="<?php echo h(base_url('/assets/css/modal.css')); ?>" />
</head>
<body>
<div class="app">
  <?php if ($isAuthenticated): ?>
    <header class="app-header">
      <div class="app-container">
        <div class="branding">
          <span class="brand-title">Open Fanfare</span>
          <span class="brand-subtitle">Gestion des présences</span>
        </div>
        <button class="menu-toggle" data-menu-toggle aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="nav-links" data-menu>
          <a class="nav-link <?php echo $activePath === '/' ? 'active' : ''; ?>" href="<?php echo h(base_url('/')); ?>">Présences</a>
          <a class="nav-link <?php echo $activePath === '/agenda' ? 'active' : ''; ?>" href="<?php echo h(base_url('/agenda')); ?>">Agenda</a>
          <a class="nav-link <?php echo $activePath === '/stats' ? 'active' : ''; ?>" href="<?php echo h(base_url('/stats')); ?>">Statistiques</a>
          <a class="nav-link <?php echo $activePath === '/admin' ? 'active' : ''; ?>" href="<?php echo h(base_url('/admin')); ?>">Administration</a>
          <form method="post" action="<?php echo h(base_url('/logout')); ?>" class="inline-form">
            <button type="submit" class="logout-button">Déconnexion</button>
          </form>
        </nav>
      </div>
    </header>
  <?php endif; ?>

  <main class="app-main app-container">
    <?php echo $content; ?>
  </main>

  <?php if ($isAuthenticated): ?>
    <footer class="app-footer">
      <div class="app-container">
        <small>© <?php echo date('Y'); ?> Open Fanfare</small>
      </div>
    </footer>
  <?php endif; ?>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="<?php echo h(base_url('/assets/js/app.js')); ?>"></script>
<script src="<?php echo h(base_url('/assets/js/charts.js')); ?>"></script>
</body>
</html>
