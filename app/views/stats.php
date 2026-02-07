<?php
$events = $events ?? [];
$instruments = $instruments ?? [];

$sortedEvents = $events;
usort($sortedEvents, fn($a, $b) => strcmp($a['date'], $b['date']));

$sortedInstruments = $instruments;
usort($sortedInstruments, function ($a, $b) {
    $sectionA = $a['section']['name'] ?? 'ZZZ';
    $sectionB = $b['section']['name'] ?? 'ZZZ';
    if ($sectionA === $sectionB) {
        return strcmp($a['name'], $b['name']);
    }
    return strcmp($sectionA, $sectionB);
});

$stats = [];
foreach ($sortedInstruments as $instrument) {
    $stats[$instrument['id']] = [];
}

foreach ($sortedEvents as $event) {
    $defaultStatus = null;
    foreach ($event['presences'] as $presence) {
        if (!empty($presence['status']['isDefault'])) {
            $defaultStatus = $presence['status'];
            break;
        }
    }
    $presentPresences = $defaultStatus
        ? array_filter($event['presences'], fn($p) => (int)$p['statusId'] === (int)$defaultStatus['id'])
        : $event['presences'];

    foreach ($presentPresences as $presence) {
        $instrumentId = $presence['musician']['instrument']['id'];
        if (!isset($stats[$instrumentId][$event['id']])) {
            $stats[$instrumentId][$event['id']] = 0;
        }
        $stats[$instrumentId][$event['id']] += 1;
    }
}

$columnTotals = [];
foreach ($sortedEvents as $event) {
    $sum = 0;
    foreach ($stats as $instrumentStats) {
        $sum += $instrumentStats[$event['id']] ?? 0;
    }
    $columnTotals[$event['id']] = $sum;
}
?>

<div class="page">
  <h1 class="page-title">Statistiques par instrument</h1>
  <p class="page-subtitle">Nombre de musiciens présents par instrument et par concert</p>

  <?php if (empty($sortedEvents)): ?>
    <p class="page-subtitle">Aucun concert pour le moment.</p>
  <?php else: ?>
    <div class="stats-table-wrapper">
      <table class="stats-table">
        <thead>
          <tr>
            <th class="sticky-col">Instrument</th>
            <?php foreach ($sortedEvents as $event): ?>
              <th>
                <div class="stats-header">
                  <div class="stats-event-title"><?php echo h($event['title']); ?></div>
                  <div class="stats-event-date"><?php echo h((new DateTime($event['date']))->format('d/m/Y')); ?></div>
                </div>
              </th>
            <?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($sortedInstruments as $instrument): ?>
            <?php
              $rowTotal = 0;
              foreach ($sortedEvents as $event) {
                  $rowTotal += $stats[$instrument['id']][$event['id']] ?? 0;
              }
              if ($rowTotal === 0) {
                  continue;
              }
            ?>
            <tr>
              <td class="sticky-col">
                <div class="instrument-name">
                  <span class="color-dot" style="background-color: <?php echo h($instrument['section']['color'] ?? '#94a3b8'); ?>"></span>
                  <span class="instrument-text">
                    <?php echo h($instrument['name']); ?>
                    <?php if (!empty($instrument['section'])): ?>
                      <span class="section-label">(<?php echo h($instrument['section']['name']); ?>)</span>
                    <?php endif; ?>
                  </span>
                </div>
              </td>
              <?php foreach ($sortedEvents as $event): ?>
                <?php $count = $stats[$instrument['id']][$event['id']] ?? 0; ?>
                <td class="stats-cell"><?php echo $count > 0 ? $count : '-'; ?></td>
              <?php endforeach; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
        <tfoot>
          <tr>
            <td class="sticky-col total-row">Total</td>
            <?php foreach ($sortedEvents as $event): ?>
              <td class="total-row"><?php echo $columnTotals[$event['id']] ?? 0; ?></td>
            <?php endforeach; ?>
          </tr>
        </tfoot>
      </table>
    </div>
  <?php endif; ?>
</div>
