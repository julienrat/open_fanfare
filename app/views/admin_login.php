<?php
$flash = $flash ?? null;
?>
<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>🔐 Administration</h1>
      <p>Veuillez vous identifier pour accéder à l'interface d'administration</p>
    </div>
    <form method="post" action="<?php echo h(base_url('/admin')); ?>" class="login-form">
      <div class="form-field">
        <label for="password">Mot de passe</label>
        <input id="password" type="password" name="password" placeholder="Entrez le mot de passe" autofocus required />
      </div>
      <?php if ($flash && $flash['type'] === 'error'): ?>
        <div class="login-error">❌ <?php echo h($flash['message']); ?></div>
      <?php endif; ?>
      <button type="submit" class="primary-button">Se connecter</button>
    </form>
  </div>
</div>
