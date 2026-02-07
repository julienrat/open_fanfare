<?php
$flash = $flash ?? null;
?>
<div class="app-login-container">
  <div class="app-login-card">
    <div class="app-login-header">
      <h1 class="app-login-title">🎺 Open Fanfare</h1>
      <p class="app-login-subtitle">Accès sécurisé</p>
    </div>
    <form method="post" action="/login" class="app-login-form">
      <label class="form-field">
        <span>Mot de passe</span>
        <input type="password" name="password" placeholder="Entrez le mot de passe" autofocus required />
      </label>
      <?php if ($flash && $flash['type'] === 'error'): ?>
        <p class="error-message"><?php echo h($flash['message']); ?></p>
      <?php endif; ?>
      <button type="submit" class="primary-button">Se connecter</button>
    </form>
  </div>
</div>
