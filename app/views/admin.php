<?php
$flash = $flash ?? null;
$sections = $sections ?? [];
$instruments = $instruments ?? [];
$musicians = $musicians ?? [];
$events = $events ?? [];

$sortedEvents = $events;
usort($sortedEvents, fn($a, $b) => strcmp($b['date'], $a['date']));

function to_datetime_local(string $iso): string
{
    $date = new DateTime($iso);
    $date->setTimezone(new DateTimeZone(date_default_timezone_get()));
    return $date->format('Y-m-d\TH:i');
}
?>

<div class="page admin-page">
  <div class="admin-header-wrapper">
    <div>
      <h1 class="page-title">Administration</h1>
      <p class="page-subtitle">Gérez les pupitres, instruments, musiciens et concerts de la fanfare.</p>
    </div>
    <form method="post" action="/admin/logout">
      <button type="submit" class="ghost-button">🚪 Déconnexion</button>
    </form>
  </div>

  <?php if ($flash): ?>
    <div class="alert <?php echo h($flash['type']); ?>"><?php echo h($flash['message']); ?></div>
  <?php endif; ?>

  <div class="admin-grid">
    <article class="admin-card full-width">
      <header class="admin-card-header">
        <div>
          <h2>Concerts</h2>
          <p class="muted-text"><?php echo count($sortedEvents); ?> concert(s)</p>
        </div>
        <div class="action-group">
          <a class="ghost-button small" href="/admin/export" title="Exporter toutes les données en JSON">⬇️ Export JSON</a>
          <form method="post" action="/admin/import" enctype="multipart/form-data" class="inline-form">
            <label class="ghost-button small inline-file">
              ⬆️ Import JSON
              <input type="file" name="json_file" accept="application/json" class="inline-file-input" onchange="this.form.submit()" />
            </label>
          </form>
          <form method="post" action="/admin/clear" class="inline-form">
            <button type="submit" class="ghost-button small delete-button" data-confirm="Supprimer toutes les données ?">🧹 Vider la base</button>
          </form>
          <a class="ghost-button small" href="/admin/export/events" title="Exporter les concerts en CSV">⬇️ CSV</a>
          <button type="button" class="ghost-button small" data-open-modal="event-import" title="Importer des concerts en CSV">⬆️ CSV</button>
          <a class="ghost-button small" href="/ical" title="Exporter tous les concerts au format iCal">📅 iCal</a>
          <button type="button" class="add-button" data-open-modal="event" title="Ajouter un concert">+</button>
        </div>
      </header>
      <div class="events-table-wrapper">
        <table class="events-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Participants</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($sortedEvents as $index => $event): ?>
              <?php $isHidden = $index >= 3; ?>
              <tr
                class="event-row <?php echo $isHidden ? 'is-hidden' : ''; ?>"
                data-open-modal="event"
                data-event-id="<?php echo (int)$event['id']; ?>"
                data-event-title="<?php echo h($event['title']); ?>"
                data-event-description="<?php echo h($event['description'] ?? ''); ?>"
                data-event-date="<?php echo h(to_datetime_local($event['date'])); ?>"
                data-event-location="<?php echo h($event['location'] ?? ''); ?>"
                data-event-price="<?php echo h($event['price'] ?? ''); ?>"
                data-event-organizer="<?php echo h($event['organizer'] ?? ''); ?>"
                data-event-setlist="<?php echo h($event['setlist'] ?? ''); ?>"
                data-expand-group="events"
              >
                <td>
                  <div class="event-title-cell">
                    <strong><?php echo h($event['title']); ?></strong>
                    <?php if (!empty($event['description'])): ?>
                      <span class="event-description-preview"><?php echo h($event['description']); ?></span>
                    <?php endif; ?>
                  </div>
                </td>
                <td>
                  <div class="event-date-cell"><?php echo h((new DateTime($event['date']))->format('d/m/Y H:i')); ?></div>
                </td>
                <td>
                  <div class="event-meta-cell">
                    <?php if (!empty($event['location'])): ?><span>📍 <?php echo h($event['location']); ?></span><?php endif; ?>
                    <?php if (!empty($event['price'])): ?><span>💰 <?php echo h($event['price']); ?></span><?php endif; ?>
                    <?php if (!empty($event['organizer'])): ?><span>👤 <?php echo h($event['organizer']); ?></span><?php endif; ?>
                  </div>
                </td>
                <td>
                  <span class="badge"><?php echo count($event['assignments']); ?> musiciens</span>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (count($sortedEvents) === 0): ?>
              <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: #94a3b8;">
                  Aucun concert. Cliquez sur + pour créer un concert.
                </td>
              </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
      <div class="form-actions" style="margin-top: 1rem;">
        <button type="button" class="ghost-button" data-expand-button="events" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
      </div>
    </article>

    <article class="admin-card">
      <header class="admin-card-header">
        <div>
          <h2>Pupitres</h2>
          <p class="muted-text"><?php echo count($sections); ?> pupitre(s)</p>
        </div>
        <div class="action-group">
          <button type="button" class="add-button" data-open-modal="section" title="Ajouter un pupitre">+</button>
        </div>
      </header>
      <ul id="sections-list" class="items-list">
        <?php foreach ($sections as $index => $section): ?>
          <li class="<?php echo $index >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="sections">
            <button
              type="button"
              class="item-card"
              data-open-modal="section"
              data-section-id="<?php echo (int)$section['id']; ?>"
              data-section-name="<?php echo h($section['name']); ?>"
              data-section-color="<?php echo h($section['color'] ?? ''); ?>"
            >
              <span class="color-dot" style="background-color: <?php echo h($section['color'] ?? '#c4b5fd'); ?>" aria-hidden></span>
              <strong><?php echo h($section['name']); ?></strong>
            </button>
          </li>
        <?php endforeach; ?>
      </ul>
      <div class="form-actions" style="margin-top: 1rem;">
        <button type="button" class="ghost-button" data-expand-button="sections" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
      </div>
    </article>

    <article class="admin-card">
      <header class="admin-card-header">
        <div>
          <h2>Instruments</h2>
          <p class="muted-text"><?php echo count($instruments); ?> instrument(s)</p>
        </div>
        <div class="action-group">
          <a class="ghost-button small" href="/admin/export/instruments" title="Exporter les instruments en CSV">⬇️ CSV</a>
          <button type="button" class="ghost-button small" data-open-modal="instrument-import" title="Importer des instruments">⬆️ CSV</button>
          <button type="button" class="add-button" data-open-modal="instrument" title="Ajouter un instrument">+</button>
        </div>
      </header>
      <ul id="instruments-list" class="items-list">
        <?php foreach ($instruments as $index => $instrument): ?>
          <li class="<?php echo $index >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="instruments">
            <button
              type="button"
              class="item-card"
              data-open-modal="instrument"
              data-instrument-id="<?php echo (int)$instrument['id']; ?>"
              data-instrument-name="<?php echo h($instrument['name']); ?>"
              data-instrument-color="<?php echo h($instrument['color'] ?? ''); ?>"
              data-instrument-section-id="<?php echo h($instrument['sectionId'] ?? ''); ?>"
            >
              <span class="color-dot" style="background-color: <?php echo h($instrument['color'] ?? '#c4b5fd'); ?>" aria-hidden></span>
              <strong><?php echo h($instrument['name']); ?></strong>
              <?php if (!empty($instrument['section'])): ?>
                <span class="chip"><?php echo h($instrument['section']['name']); ?></span>
              <?php endif; ?>
            </button>
          </li>
        <?php endforeach; ?>
      </ul>
      <div class="form-actions" style="margin-top: 1rem;">
        <button type="button" class="ghost-button" data-expand-button="instruments" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
      </div>
    </article>

    <article class="admin-card">
      <header class="admin-card-header">
        <div>
          <h2>Musiciens</h2>
          <p class="muted-text"><?php echo count($musicians); ?> musicien(s)</p>
        </div>
        <div class="action-group">
          <a class="ghost-button small" href="/admin/export/musicians" title="Exporter les musiciens en CSV">⬇️ CSV</a>
          <button type="button" class="ghost-button small" data-open-modal="import" title="Importer depuis CSV">⬆️ CSV</button>
          <button type="button" class="add-button" data-open-modal="musician" title="Ajouter un musicien">+</button>
        </div>
      </header>
      <ul id="musicians-list" class="items-list">
        <?php foreach ($musicians as $index => $musician): ?>
          <li class="<?php echo $index >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="musicians">
            <button
              type="button"
              class="item-card"
              data-open-modal="musician"
              data-musician-id="<?php echo (int)$musician['id']; ?>"
              data-musician-first-name="<?php echo h($musician['firstName']); ?>"
              data-musician-last-name="<?php echo h($musician['lastName']); ?>"
              data-musician-instrument-id="<?php echo (int)$musician['instrumentId']; ?>"
              data-musician-color="<?php echo h($musician['color'] ?? ''); ?>"
              data-musician-email="<?php echo h($musician['email'] ?? ''); ?>"
              data-musician-phone="<?php echo h($musician['phone'] ?? ''); ?>"
            >
              <strong><?php echo h($musician['firstName'] . ' ' . $musician['lastName']); ?></strong>
              <span class="chip"><?php echo h($musician['instrument']['name']); ?></span>
            </button>
          </li>
        <?php endforeach; ?>
      </ul>
      <div class="form-actions" style="margin-top: 1rem;">
        <button type="button" class="ghost-button" data-expand-button="musicians" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
      </div>
    </article>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="section">
  <div class="modal">
    <div class="modal-header">
      <h2 data-modal-title>Modifier le pupitre</h2>
      <button class="icon-button" data-close-modal="section" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" class="form" data-admin-form="section">
        <input type="hidden" name="id" value="" />
        <label class="form-field">
          <span>Nom</span>
          <input name="name" required />
        </label>
        <label class="form-field">
          <span>Couleur (hex)</span>
          <input name="color" placeholder="#60a5fa" />
        </label>
        <div class="form-actions">
          <button type="submit" name="action" value="section_save" class="primary-button">Enregistrer</button>
          <button type="button" class="ghost-button" data-close-modal="section">Annuler</button>
          <button type="submit" name="action" value="section_delete" class="ghost-button delete-button" data-delete-button>Supprimer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="instrument">
  <div class="modal">
    <div class="modal-header">
      <h2 data-modal-title>Modifier l'instrument</h2>
      <button class="icon-button" data-close-modal="instrument" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" class="form" data-admin-form="instrument">
        <input type="hidden" name="id" value="" />
        <label class="form-field">
          <span>Nom</span>
          <input name="name" required />
        </label>
        <label class="form-field">
          <span>Pupitre</span>
          <select name="section_id">
            <option value="">Aucun</option>
            <?php foreach ($sections as $section): ?>
              <option value="<?php echo (int)$section['id']; ?>"><?php echo h($section['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <label class="form-field">
          <span>Couleur (hex)</span>
          <input name="color" placeholder="#60a5fa" />
        </label>
        <div class="form-actions">
          <button type="submit" name="action" value="instrument_save" class="primary-button">Enregistrer</button>
          <button type="button" class="ghost-button" data-close-modal="instrument">Annuler</button>
          <button type="submit" name="action" value="instrument_delete" class="ghost-button delete-button" data-delete-button>Supprimer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="musician">
  <div class="modal">
    <div class="modal-header">
      <h2 data-modal-title>Modifier le musicien</h2>
      <button class="icon-button" data-close-modal="musician" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" class="form" data-admin-form="musician">
        <input type="hidden" name="id" value="" />
        <div class="form-grid">
          <label class="form-field">
            <span>Prénom</span>
            <input name="first_name" required />
          </label>
          <label class="form-field">
            <span>Nom</span>
            <input name="last_name" required />
          </label>
        </div>
        <label class="form-field">
          <span>Instrument</span>
          <select name="instrument_id" required>
            <option value="">Choisir…</option>
            <?php foreach ($instruments as $instrument): ?>
              <option value="<?php echo (int)$instrument['id']; ?>"><?php echo h($instrument['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <div class="form-grid">
          <label class="form-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="alice@example.com" />
          </label>
          <label class="form-field">
            <span>Téléphone</span>
            <input name="phone" placeholder="+33600000000" />
          </label>
        </div>
        <label class="form-field">
          <span>Couleur (hex)</span>
          <input name="color" placeholder="#f97316" />
        </label>
        <div class="form-actions">
          <button type="submit" name="action" value="musician_save" class="primary-button">Enregistrer</button>
          <button type="button" class="ghost-button" data-close-modal="musician">Annuler</button>
          <button type="submit" name="action" value="musician_delete" class="ghost-button delete-button" data-delete-button>Supprimer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="event">
  <div class="modal">
    <div class="modal-header">
      <h2 data-modal-title>Modifier le concert</h2>
      <button class="icon-button" data-close-modal="event" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" class="form" data-admin-form="event">
        <input type="hidden" name="id" value="" />
        <label class="form-field">
          <span>Titre</span>
          <input name="title" required />
        </label>
        <div class="form-grid">
          <label class="form-field">
            <span>Date et heure</span>
            <input type="datetime-local" name="date" required />
          </label>
          <label class="form-field">
            <span>Lieu</span>
            <input name="location" placeholder="Place de la République" />
          </label>
        </div>
        <div class="form-grid">
          <label class="form-field">
            <span>Tarif</span>
            <input name="price" placeholder="Participation libre, 10€..." />
          </label>
          <label class="form-field">
            <span>Organisateur</span>
            <input name="organizer" placeholder="Association, mairie..." />
          </label>
        </div>
        <label class="form-field">
          <span>Description</span>
          <textarea name="description" rows="3" placeholder="Détails du concert, programme..."></textarea>
        </label>
        <p class="muted-text">Markdown accepté : **gras**, *italique*, [lien](https://...), # Titre, - liste.</p>
        <label class="form-field">
          <span>Setlist (liste des morceaux)</span>
          <textarea name="setlist" rows="5" placeholder="Ex: # Acte 1&#10;- Oh When the Saints&#10;- La Bamba&#10;[Lien](https://...)"></textarea>
        </label>
        <p class="muted-text">Markdown accepté pour la setlist (titres, listes, liens).</p>
        <p class="muted-text">Tous les musiciens disponibles seront automatiquement ajoutés à cet événement.</p>
        <div class="form-actions">
          <button type="submit" name="action" value="event_save" class="primary-button">Enregistrer</button>
          <button type="button" class="ghost-button" data-close-modal="event">Annuler</button>
          <button type="submit" name="action" value="event_delete" class="ghost-button delete-button" data-delete-button>Supprimer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="import">
  <div class="modal">
    <div class="modal-header">
      <h2>Importer des musiciens</h2>
      <button class="icon-button" data-close-modal="import" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" enctype="multipart/form-data" class="form">
        <div class="import-block">
          <p class="import-help">Format attendu : <code>nom;prenom;instrument;mail;telephone</code> avec une première ligne d'en-tête.</p>
          <div class="import-actions">
            <label class="import-upload">
              <input type="file" name="csv_file" accept=".csv,text/csv" required />
              <span>Choisir un fichier CSV</span>
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" name="action" value="musician_import" class="primary-button">Importer</button>
          <button type="button" class="ghost-button" data-close-modal="import">Fermer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="instrument-import">
  <div class="modal">
    <div class="modal-header">
      <h2>Importer des instruments</h2>
      <button class="icon-button" data-close-modal="instrument-import" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" enctype="multipart/form-data" class="form">
        <input type="hidden" name="action" value="instrument_import" />
        <div class="import-block">
          <p class="import-help">
            Format attendu : <code>nom;couleur;section</code> avec une première ligne d'en-tête.
          </p>
          <div class="import-actions">
            <label class="import-upload">
              <input type="file" name="instrument_csv" accept=".csv,text/csv" required />
              <span>Choisir un fichier CSV</span>
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="primary-button">Importer</button>
          <button type="button" class="ghost-button" data-close-modal="instrument-import">Fermer</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-backdrop is-hidden" data-modal="event-import">
  <div class="modal">
    <div class="modal-header">
      <h2>Importer des concerts</h2>
      <button class="icon-button" data-close-modal="event-import" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/admin" enctype="multipart/form-data" class="form">
        <input type="hidden" name="action" value="event_import" />
        <div class="import-block">
          <p class="import-help">
            Format attendu : <code>titre;description;date;lieu;tarif;organisateur;setlist</code> avec une première ligne d'en-tête.
          </p>
          <div class="import-actions">
            <label class="import-upload">
              <input type="file" name="event_csv" accept=".csv,text/csv" required />
              <span>Choisir un fichier CSV</span>
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="primary-button">Importer</button>
          <button type="button" class="ghost-button" data-close-modal="event-import">Fermer</button>
        </div>
      </form>
    </div>
  </div>
</div>
