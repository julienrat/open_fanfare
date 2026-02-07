<?php
$flash = $flash ?? null;
$events = $events ?? [];
$statuses = $statuses ?? [];

$monthParam = $_GET['month'] ?? null;
$yearParam = $_GET['year'] ?? null;
$dateParam = $_GET['date'] ?? null;

$today = new DateTime('first day of this month');
if ($monthParam && $yearParam) {
    $month = (int)$monthParam;
    $year = (int)$yearParam;
    $today = DateTime::createFromFormat('Y-n-j', $year . '-' . $month . '-1') ?: $today;
}

$monthStart = clone $today;
$monthStart->modify('first day of this month');
$monthEnd = clone $today;
$monthEnd->modify('last day of this month');

$selectedDate = null;
if ($dateParam) {
    $selectedDate = DateTime::createFromFormat('Y-m-d', $dateParam) ?: null;
}

function format_month_name(DateTime $date): string
{
    if (class_exists('IntlDateFormatter')) {
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::LONG, IntlDateFormatter::NONE, $date->getTimezone(), IntlDateFormatter::GREGORIAN, 'MMMM yyyy');
        return $formatter->format($date);
    }
    $months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    $monthIndex = (int)$date->format('n') - 1;
    $monthName = $months[$monthIndex] ?? $date->format('F');
    return $monthName . ' ' . $date->format('Y');
}

function format_event_time(string $iso): string
{
    $date = new DateTime($iso);
    return $date->format('H:i');
}

function format_day_title(string $dayKey): string
{
    $date = DateTime::createFromFormat('Y-m-d', $dayKey);
    if (!$date) {
        return $dayKey;
    }
    if (class_exists('IntlDateFormatter')) {
        $formatter = new IntlDateFormatter('fr_FR', IntlDateFormatter::FULL, IntlDateFormatter::NONE, $date->getTimezone(), IntlDateFormatter::GREGORIAN, 'EEEE d MMMM yyyy');
        return $formatter->format($date);
    }
    $days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    $months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    $dayName = $days[(int)$date->format('w')] ?? '';
    $monthName = $months[(int)$date->format('n') - 1] ?? '';
    return trim($dayName . ' ' . $date->format('j') . ' ' . $monthName . ' ' . $date->format('Y'));
}

function compute_event_stats(array $event, array $statuses): array
{
    $totalAssignments = count($event['assignments']);
    $totalResponses = count($event['presences']);
    $responsePercentage = $totalAssignments > 0 ? (int)round(($totalResponses / $totalAssignments) * 100) : 0;

    $responsesByStatus = [];
    foreach ($statuses as $status) {
        $responsesByStatus[$status['label']] = 0;
    }
    foreach ($event['presences'] as $presence) {
        $label = $presence['status']['label'];
        if (!isset($responsesByStatus[$label])) {
            $responsesByStatus[$label] = 0;
        }
        $responsesByStatus[$label] += 1;
    }

    $defaultStatus = null;
    foreach ($statuses as $status) {
        if (!empty($status['isDefault'])) {
            $defaultStatus = $status;
            break;
        }
    }

    $presentPresences = $defaultStatus
        ? array_filter($event['presences'], fn($p) => (int)$p['statusId'] === (int)$defaultStatus['id'])
        : $event['presences'];
    $presentCount = count($presentPresences);

    $instrumentsMap = [];
    $appendInstrument = function (array $instrument) use (&$instrumentsMap) {
        $id = $instrument['id'];
        if (!isset($instrumentsMap[$id])) {
            $instrumentsMap[$id] = ['name' => $instrument['name'], 'count' => 0, 'color' => $instrument['color']];
        }
        $instrumentsMap[$id]['count'] += 1;
    };

    foreach ($presentPresences as $presence) {
        $appendInstrument($presence['musician']['instrument']);
    }

    return [
        'event' => $event,
        'totalAssignments' => $totalAssignments,
        'totalResponses' => $totalResponses,
        'presentCount' => $presentCount,
        'responsePercentage' => $responsePercentage,
        'responsesByStatus' => $responsesByStatus,
        'instrumentsStats' => array_values($instrumentsMap),
    ];
}

$eventStats = array_map(fn($event) => compute_event_stats($event, $statuses), $events);
$eventsByDay = [];
foreach ($eventStats as $stat) {
    $key = (new DateTime($stat['event']['date']))->format('Y-m-d');
    $eventsByDay[$key][] = $stat;
}

$prevMonth = (clone $monthStart)->modify('-1 month');
$nextMonth = (clone $monthStart)->modify('+1 month');
$weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
?>

<div class="page">
  <div class="agenda-header-wrapper">
    <div>
      <h1 class="page-title">Agenda des concerts</h1>
      <p class="page-subtitle">Consultez le calendrier des concerts et les statistiques d'instruments.</p>
    </div>
    <a class="primary-button" href="<?php echo h(base_url('/ical')); ?>" title="Exporter l'agenda au format iCal">📅 Exporter dans mon agenda</a>
  </div>

  <div class="agenda-layout">
    <div class="calendar-section">
      <div class="calendar-card">
        <div class="calendar-header">
          <a class="month-nav-button" href="<?php echo h(base_url('/agenda')); ?>?month=<?php echo $prevMonth->format('n'); ?>&year=<?php echo $prevMonth->format('Y'); ?>">←</a>
          <h2 class="current-month"><?php echo h(format_month_name($monthStart)); ?></h2>
          <a class="month-nav-button" href="<?php echo h(base_url('/agenda')); ?>?month=<?php echo $nextMonth->format('n'); ?>&year=<?php echo $nextMonth->format('Y'); ?>">→</a>
        </div>

        <div class="calendar-weekdays">
          <?php foreach ($weekDays as $day): ?>
            <div class="weekday"><?php echo h($day); ?></div>
          <?php endforeach; ?>
        </div>

        <div class="calendar-grid">
          <?php
            $startOfGrid = clone $monthStart;
            $weekDayIndex = (int)$startOfGrid->format('N');
            $startOfGrid->modify('-' . ($weekDayIndex - 1) . ' days');

            $endOfGrid = clone $monthEnd;
            $weekDayIndexEnd = (int)$endOfGrid->format('N');
            $endOfGrid->modify('+' . (7 - $weekDayIndexEnd) . ' days');

            $current = clone $startOfGrid;
            while ($current <= $endOfGrid):
              $dayKey = $current->format('Y-m-d');
              $isCurrentMonth = $current->format('m') === $monthStart->format('m');
              $hasEvents = isset($eventsByDay[$dayKey]);
              $modalId = $hasEvents ? ('agenda-day-' . $dayKey) : '';
          ?>
            <button
              type="button"
              class="calendar-day <?php echo !$isCurrentMonth ? 'inactive' : ''; ?> <?php echo $hasEvents ? 'has-events' : ''; ?>"
              <?php if ($hasEvents): ?>data-open-modal="<?php echo h($modalId); ?>"<?php endif; ?>
              <?php if (!$isCurrentMonth && !$hasEvents): ?>disabled<?php endif; ?>
            >
              <span class="day-number"><?php echo $current->format('j'); ?></span>
              <?php if ($hasEvents): ?>
                <div class="day-events">
                  <?php foreach ($eventsByDay[$dayKey] as $stat): ?>
                    <span class="event-chip"><?php echo h($stat['event']['title']); ?></span>
                  <?php endforeach; ?>
                </div>
              <?php endif; ?>
            </button>
          <?php
              $current->modify('+1 day');
            endwhile;
          ?>
        </div>
      </div>
    </div>
  </div>
</div>

<?php foreach ($eventsByDay as $dayKey => $stats): ?>
  <?php $modalId = 'agenda-day-' . $dayKey; ?>
  <div class="modal-backdrop is-hidden" data-modal="<?php echo h($modalId); ?>">
    <div class="modal">
      <div class="modal-header">
        <h2><?php echo h(format_day_title($dayKey)); ?></h2>
        <button class="icon-button" data-close-modal="<?php echo h($modalId); ?>" aria-label="Fermer">×</button>
      </div>
      <div class="modal-body">
        <?php foreach ($stats as $stat): ?>
          <div class="event-detail">
            <div class="event-detail-header">
              <h3><?php echo h($stat['event']['title']); ?></h3>
              <div class="event-detail-meta">
                <span>⏰ <?php echo h(format_day_title($dayKey)); ?> - <?php echo h(format_event_time($stat['event']['date'])); ?></span>
                <?php if (!empty($stat['event']['location'])): ?>
                  <span>📍 <?php echo h($stat['event']['location']); ?></span>
                <?php endif; ?>
              </div>
            </div>

            <div class="event-stats-row">
              <div class="stat-box">
                <span class="stat-label">Présents</span>
                <span class="stat-value"><?php echo $stat['presentCount']; ?></span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Réponses</span>
                <span class="stat-value"><?php echo $stat['totalResponses']; ?></span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Taux</span>
                <span class="stat-value" style="color: <?php
                  $pct = $stat['responsePercentage'];
                  echo $pct >= 80 ? '#22c55e' : ($pct >= 60 ? '#eab308' : ($pct >= 40 ? '#f97316' : '#ef4444'));
                ?>">
                  <?php echo $stat['responsePercentage']; ?>%
                </span>
              </div>
            </div>

            <?php if (!empty($stat['instrumentsStats'])): ?>
              <div class="instruments-section">
                <h4>Répartition par instrument</h4>
                <div class="instruments-chart">
                  <div class="chart-canvas-wrapper">
                    <canvas class="chart-canvas" data-chart='<?php echo h(json_encode($stat['instrumentsStats'])); ?>'></canvas>
                  </div>
                </div>
              </div>
            <?php endif; ?>

            <?php if (!empty($stat['responsesByStatus'])): ?>
              <div class="response-breakdown">
                <p class="breakdown-title">Détail des réponses :</p>
                <div class="breakdown-items">
                  <?php foreach ($stat['responsesByStatus'] as $label => $count): ?>
                    <span class="breakdown-item"><?php echo h($label); ?>: <strong><?php echo $count; ?></strong></span>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
<?php endforeach; ?>
