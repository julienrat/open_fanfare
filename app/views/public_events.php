<?php
$flash = $flash ?? null;
$statuses = $statuses ?? [];
$events = $events ?? [];

$defaultStatus = null;
foreach ($statuses as $status) {
    if (!empty($status['isDefault'])) {
        $defaultStatus = $status;
        break;
    }
}

function normalize_status_label(string $label): string
{
    $normalized = strtolower(trim($label));
    if (function_exists('iconv')) {
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT', $normalized);
    }
    $normalized = preg_replace('/[^a-z]+/', '', $normalized);
    return $normalized ?? $label;
}

$uniqueStatuses = [];
foreach ($statuses as $status) {
    $key = normalize_status_label($status['label']);
    if (!isset($uniqueStatuses[$key])) {
        $uniqueStatuses[$key] = $status;
    } elseif (!empty($status['isDefault'])) {
        $uniqueStatuses[$key] = $status;
    }
}
$statuses = array_values($uniqueStatuses);

function format_event_date(string $iso): string
{
    try {
        $date = new DateTime($iso);
        if (class_exists('IntlDateFormatter')) {
            $formatter = new IntlDateFormatter(
                'fr_FR',
                IntlDateFormatter::FULL,
                IntlDateFormatter::SHORT,
                $date->getTimezone(),
                IntlDateFormatter::GREGORIAN,
                "EEEE d MMMM yyyy - HH:mm"
            );
            return $formatter->format($date);
        }
        return $date->format('d/m/Y H:i');
    } catch (Throwable $e) {
        return $iso;
    }
}

function compute_participation_data(array $event, ?array $defaultStatus): array
{
    $counts = [];
    $defaultStatusId = $defaultStatus['id'] ?? null;
    $presences = $event['presences'] ?? [];
    $assignments = $event['assignments'] ?? [];

    $presentPresences = $defaultStatusId
        ? array_filter($presences, fn($p) => (int)$p['statusId'] === (int)$defaultStatusId)
        : $presences;

    if (count($presentPresences) > 0) {
        foreach ($presentPresences as $presence) {
            $instrument = $presence['musician']['instrument'];
            $id = $instrument['id'];
            if (!isset($counts[$id])) {
                $counts[$id] = ['name' => $instrument['name'], 'value' => 0, 'color' => $instrument['color']];
            }
            $counts[$id]['value'] += 1;
        }
    }

    return array_values($counts);
}

function compute_missing_data(array $event, ?array $defaultStatus): array
{
    $defaultStatusId = $defaultStatus['id'] ?? null;
    $presences = $event['presences'] ?? [];
    $assignments = $event['assignments'] ?? [];

    $presentMusicianIds = [];
    foreach ($presences as $presence) {
        if ($defaultStatusId === null || (int)$presence['statusId'] === (int)$defaultStatusId) {
            $presentMusicianIds[] = (int)$presence['musicianId'];
        }
    }

    $counts = [];
    foreach ($assignments as $assignment) {
        if (in_array((int)$assignment['musicianId'], $presentMusicianIds, true)) {
            continue;
        }
        $instrument = $assignment['musician']['instrument'];
        $id = $instrument['id'];
        if (!isset($counts[$id])) {
            $counts[$id] = ['name' => $instrument['name'], 'value' => 0, 'color' => $instrument['color']];
        }
        $counts[$id]['value'] += 1;
    }
    return array_values($counts);
}
?>

<div class="page">
  <h1 class="page-title" data-presences-title>Présences aux concerts</h1>
  <p class="page-subtitle">
    Consultez les concerts à venir, confirmez votre présence et visualisez la participation par instrument.
  </p>

  <?php if ($flash): ?>
    <div class="alert <?php echo h($flash['type']); ?>"><?php echo h($flash['message']); ?></div>
  <?php endif; ?>

  <?php if (empty($events)): ?>
    <p>Aucun événement pour le moment. Revenez bientôt !</p>
  <?php else: ?>
    <div class="cards-grid">
      <?php foreach ($events as $event): ?>
        <?php
          $assignments = $event['assignments'] ?? [];
          $presences = $event['presences'] ?? [];
          $totalAssignments = count($assignments);
          $totalResponses = count($presences);
          $participationRate = $totalAssignments > 0 ? round(($totalResponses / $totalAssignments) * 100) : 0;
          $participationData = compute_participation_data($event, $defaultStatus);
          $missingData = compute_missing_data($event, $defaultStatus);
          $detailModalId = 'event-detail-' . (int)$event['id'];
          $presentPresences = [];
          if ($defaultStatus) {
              foreach ($presences as $presence) {
                  if ((int)$presence['statusId'] === (int)$defaultStatus['id']) {
                      $presentPresences[] = $presence;
                  }
              }
          } else {
              $presentPresences = $presences;
          }
          $respondedIds = array_values(array_unique(array_map(fn($p) => (int)$p['musicianId'], $presences)));
          $respondedAttr = implode(',', $respondedIds);
        ?>
        <article class="card clickable" data-open-modal="<?php echo h($detailModalId); ?>">
          <header class="card-header">
            <div class="card-header-content">
              <h2><?php echo h($event['title']); ?></h2>
              <p class="card-date"><?php echo h(format_event_date($event['date'])); ?></p>
              <?php if (!empty($event['location'])): ?>
                <p class="card-location">📍 <?php echo h($event['location']); ?></p>
              <?php endif; ?>
              <div class="card-meta">
                <span class="stat-badge">Présents: <?php echo count($presentPresences); ?></span>
                <span class="stat-badge">Réponses: <?php echo $totalResponses; ?></span>
                <span class="stat-badge participation-rate"><?php echo $participationRate; ?>%</span>
              </div>
            </div>
            <button
              type="button"
              class="primary-button"
              data-open-modal="presence"
              data-event-id="<?php echo (int)$event['id']; ?>"
              data-event-title="<?php echo h($event['title']); ?>"
              data-responded-ids="<?php echo h($respondedAttr); ?>"
              data-default-label="Répondre"
              data-stop-propagation
            >
              Répondre
            </button>
          </header>
          <?php if (!empty($event['description'])): ?>
            <div class="card-description"><?php echo markdown_to_html($event['description']); ?></div>
          <?php endif; ?>
        </article>

        <div class="modal-backdrop is-hidden" data-modal="<?php echo h($detailModalId); ?>">
          <div class="modal">
            <div class="modal-header">
              <h2><?php echo h($event['title']); ?></h2>
              <button class="icon-button" data-close-modal="<?php echo h($detailModalId); ?>" aria-label="Fermer">×</button>
            </div>
            <div class="modal-body">
              <div class="card-meta" style="margin-bottom: 1rem;">
                <span class="stat-badge">📅 <?php echo h(format_event_date($event['date'])); ?></span>
                <?php if (!empty($event['location'])): ?>
                  <span class="stat-badge">📍 <?php echo h($event['location']); ?></span>
                <?php endif; ?>
                <?php if (!empty($event['price'])): ?>
                  <span class="stat-badge">💰 <?php echo h($event['price']); ?></span>
                <?php endif; ?>
                <?php if (!empty($event['organizer'])): ?>
                  <span class="stat-badge">👤 <?php echo h($event['organizer']); ?></span>
                <?php endif; ?>
              </div>

              <?php if (!empty($event['description'])): ?>
                <div class="card-description"><?php echo markdown_to_html($event['description']); ?></div>
              <?php endif; ?>

              <?php if (!empty($event['setlist'])): ?>
                <div class="attendance-list" style="margin-top: 1rem;">
                  <div class="attendance-header">
                    <h3>Setlist</h3>
                  </div>
                  <div class="attendance-items">
                    <div class="card-description"><?php echo markdown_to_html($event['setlist']); ?></div>
                  </div>
                </div>
              <?php endif; ?>

              <div class="charts-container">
                <div class="chart-title">Participation par instrument</div>
                <div class="chart-card">
                  <div class="chart-area">
                    <?php if (!empty($participationData)): ?>
                      <div class="chart-canvas-wrapper">
                        <canvas class="chart-canvas" data-chart='<?php echo h(json_encode($participationData)); ?>'></canvas>
                      </div>
                    <?php else: ?>
                      <p class="chart-empty">Pas d'inscrits.</p>
                    <?php endif; ?>
                  </div>
                </div>
              </div>

              <?php
                $presentPresences = [];
                if ($defaultStatus) {
                  foreach ($presences as $presence) {
                    if ((int)$presence['statusId'] === (int)$defaultStatus['id']) {
                      $presentPresences[] = $presence;
                    }
                  }
                } else {
                  $presentPresences = $presences;
                }

                $sectionsMap = [];
                $instrumentMap = [];
                foreach ($presentPresences as $presence) {
                  $sectionName = $presence['musician']['instrument']['section']['name'] ?? 'Sans pupitre';
                  $instrumentName = $presence['musician']['instrument']['name'];
                  if (!isset($instrumentMap[$instrumentName])) {
                    $instrumentMap[$instrumentName] = 0;
                  }
                  $instrumentMap[$instrumentName] += 1;
                  if (!isset($sectionsMap[$sectionName])) {
                    $sectionsMap[$sectionName] = 0;
                  }
                  $sectionsMap[$sectionName] += 1;
                }
              ?>

              <div class="attendance-list" style="margin-top: 1.5rem;">
                <div class="attendance-header">
                  <h3>Musiciens présents</h3>
                  <span class="muted-text"><?php echo count($presentPresences); ?> musicien(s)</span>
                </div>
                <div class="attendance-items">
                  <?php foreach ($presentPresences as $index => $presence): ?>
                    <div class="attendance-item <?php echo $index >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="present-<?php echo (int)$event['id']; ?>">
                      <div class="attendance-info">
                        <span class="attendance-name"><?php echo h($presence['musician']['firstName'] . ' ' . $presence['musician']['lastName']); ?></span>
                        <span class="attendance-instrument"><?php echo h($presence['musician']['instrument']['name']); ?></span>
                      </div>
                      <span class="status-chip" style="background: <?php echo h($presence['status']['color'] ?? '#e2e8f0'); ?>">
                        <?php echo h($presence['status']['label']); ?>
                      </span>
                    </div>
                  <?php endforeach; ?>
                </div>
                <div class="form-actions" style="margin-top: 0.75rem;">
                  <button type="button" class="ghost-button" data-expand-button="present-<?php echo (int)$event['id']; ?>" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
                </div>
              </div>

              <div class="attendance-list" style="margin-top: 1rem;">
                <div class="attendance-header">
                  <h3>Instruments présents</h3>
                  <span class="muted-text"><?php echo count($instrumentMap); ?> instrument(s)</span>
                </div>
                <div class="attendance-items">
                  <?php $instrumentIndex = 0; ?>
                  <?php foreach ($instrumentMap as $instrumentName => $count): ?>
                    <div class="attendance-item <?php echo $instrumentIndex >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="instruments-<?php echo (int)$event['id']; ?>">
                      <div class="attendance-info">
                        <span class="attendance-name"><?php echo h($instrumentName); ?></span>
                        <span class="attendance-instrument"><?php echo h($count); ?> musicien(s)</span>
                      </div>
                    </div>
                    <?php $instrumentIndex++; ?>
                  <?php endforeach; ?>
                </div>
                <div class="form-actions" style="margin-top: 0.75rem;">
                  <button type="button" class="ghost-button" data-expand-button="instruments-<?php echo (int)$event['id']; ?>" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
                </div>
              </div>

              <div class="attendance-list" style="margin-top: 1.5rem;">
                <div class="attendance-header">
                  <h3>Pupitres</h3>
                  <span class="muted-text"><?php echo count($sectionsMap); ?> pupitre(s)</span>
                </div>
                <div class="attendance-items">
                  <?php $sectionIndex = 0; ?>
                  <?php foreach ($sectionsMap as $sectionName => $count): ?>
                    <div class="attendance-item <?php echo $sectionIndex >= 3 ? 'is-hidden' : ''; ?>" data-expand-group="sections-<?php echo (int)$event['id']; ?>">
                      <div class="attendance-info">
                        <span class="attendance-name"><?php echo h($sectionName); ?></span>
                        <span class="attendance-instrument"><?php echo h($count); ?> musicien(s)</span>
                      </div>
                    </div>
                    <?php $sectionIndex++; ?>
                  <?php endforeach; ?>
                </div>
                <div class="form-actions" style="margin-top: 0.75rem;">
                  <button type="button" class="ghost-button" data-expand-button="sections-<?php echo (int)$event['id']; ?>" data-expand-open="Déplier" data-expand-close="Replier">Déplier</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>

<div class="modal-backdrop is-hidden" data-modal="presence">
  <div class="modal">
    <div class="modal-header">
      <h2 data-modal-title>Répondre à l'événement</h2>
      <button class="icon-button" data-close-modal="presence" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body">
      <form method="post" action="/presence" class="form" data-presence-form>
        <input type="hidden" name="event_id" value="" />
        <input type="hidden" name="musician_id" value="" />

        <label class="form-field">
          <span>Musicien assigné</span>
          <select name="musician_select" data-musician-select>
            <option value="">Choisir un musicien</option>
            <?php foreach ($musicians as $musician): ?>
              <option value="<?php echo (int)$musician['id']; ?>" data-first-name="<?php echo h($musician['firstName']); ?>" data-last-name="<?php echo h($musician['lastName']); ?>">
                <?php echo h($musician['firstName'] . ' ' . $musician['lastName']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </label>

        <div class="form-grid">
          <label class="form-field">
            <span>Prénom</span>
            <input type="text" name="first_name" placeholder="Votre prénom" />
          </label>
          <label class="form-field">
            <span>Nom</span>
            <input type="text" name="last_name" placeholder="Votre nom" />
          </label>
        </div>

        <fieldset class="form-field">
          <legend>Votre réponse</legend>
          <div class="radio-group">
            <?php foreach ($statuses as $status): ?>
              <label class="radio-option">
                <input type="radio" name="status_id" value="<?php echo (int)$status['id']; ?>" required />
                <span class="radio-label">
                  <span class="color-dot" style="background-color: <?php echo h($status['color'] ?? '#e2e8f0'); ?>"></span>
                  <?php echo h($status['label']); ?>
                </span>
              </label>
            <?php endforeach; ?>
          </div>
        </fieldset>

        <label class="form-field">
          <span>Commentaire (optionnel)</span>
          <textarea name="comment" rows="3" placeholder="Votre message..."></textarea>
        </label>

        <div class="form-actions">
          <button type="button" class="ghost-button" data-close-modal="presence">Annuler</button>
          <button type="submit" class="primary-button">Envoyer</button>
        </div>
      </form>
    </div>
  </div>
</div>
