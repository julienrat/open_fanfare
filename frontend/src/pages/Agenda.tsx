import { useMemo, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEvents, useStatuses } from '../api/queries'
import { downloadICalFile } from '../api/icalExport'
import type { Event } from '../api/types'

const formatEventTime = (date: string) => format(new Date(date), 'HH:mm', { locale: fr })

interface EventStatistics {
  event: Event
  totalAssignments: number
  totalResponses: number
  responsePercentage: number
  responsesByStatus: Record<string, number>
  instrumentsStats: Array<{ name: string; count: number; color?: string | null }>
}

const computeEventStatistics = (event: Event, statuses: any[] | undefined): EventStatistics => {
  const totalAssignments = event.assignments.length
  const totalResponses = event.presences.length
  const responsePercentage =
    totalAssignments > 0 ? Math.round((totalResponses / totalAssignments) * 100) : 0

  const responsesByStatus: Record<string, number> = {}
  if (statuses) {
    statuses.forEach((status) => {
      responsesByStatus[status.label] = event.presences.filter(
        (presence) => presence.statusId === status.id
      ).length
    })
  }

  // Calculate instrument statistics
  const defaultStatus = statuses?.find((s) => s.isDefault)
  const presentPresences = defaultStatus
    ? event.presences.filter((presence) => presence.statusId === defaultStatus.id)
    : event.presences

  const instrumentsMap = new Map<number, { name: string; count: number; color?: string | null }>()
  const appendInstrument = (instrumentId: number, name: string, color?: string | null) => {
    const existing = instrumentsMap.get(instrumentId)
    if (existing) {
      existing.count += 1
    } else {
      instrumentsMap.set(instrumentId, { name, count: 1, color })
    }
  }

  if (presentPresences.length > 0) {
    presentPresences.forEach((presence) => {
      appendInstrument(
        presence.musician.instrumentId,
        presence.musician.instrument.name,
        presence.musician.instrument.color
      )
    })
  } else {
    event.assignments.forEach((assignment) => {
      appendInstrument(
        assignment.musician.instrumentId,
        assignment.musician.instrument.name,
        assignment.musician.instrument.color
      )
    })
  }

  const instrumentsStats = Array.from(instrumentsMap.values())

  return {
    event,
    totalAssignments,
    totalResponses,
    responsePercentage,
    responsesByStatus,
    instrumentsStats,
  }
}

function getSaturationColor(percentage: number): string {
  if (percentage >= 80) return '#22c55e'
  if (percentage >= 60) return '#eab308'
  if (percentage >= 40) return '#f97316'
  return '#ef4444'
}

export const AgendaPage = () => {
  const { data: events, isLoading, isError } = useEvents()
  const { data: statuses } = useStatuses()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const sortedEvents = useMemo(
    () => (events ?? []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  )

  const eventStatistics = useMemo(
    () => sortedEvents.map((event) => computeEventStatistics(event, statuses)),
    [sortedEvents, statuses]
  )

  // Calendar calculation
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get events for current month
  const eventsInMonth = useMemo(
    () =>
      eventStatistics.filter((stat) => {
        const eventDate = new Date(stat.event.date)
        return isSameMonth(eventDate, currentMonth)
      }),
    [eventStatistics, currentMonth]
  )

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, EventStatistics[]>()
    eventsInMonth.forEach((stat) => {
      const dayKey = format(new Date(stat.event.date), 'yyyy-MM-dd')
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, [])
      }
      grouped.get(dayKey)!.push(stat)
    })
    return grouped
  }, [eventsInMonth])

  // Get selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const dayKey = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDay.get(dayKey) || []
  }, [selectedDate, eventsByDay])

  const monthName = format(currentMonth, 'MMMM yyyy', { locale: fr })
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  if (isLoading) {
    return <p>Chargement de l'agenda…</p>
  }

  if (isError) {
    return <p>Impossible de récupérer les événements. Merci de réessayer plus tard.</p>
  }

  if (!sortedEvents.length) {
    return <p>Aucun événement pour le moment. Revenez bientôt !</p>
  }

  return (
    <div className="page">
      <div className="agenda-header-wrapper">
        <div>
          <h1 className="page-title">Agenda des concerts</h1>
          <p className="page-subtitle">Consultez le calendrier des concerts et les statistiques d'instruments.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => downloadICalFile(sortedEvents)}
          title="Exporter l'agenda au format iCal"
        >
          📅 Exporter iCal
        </button>
      </div>

      <div className="agenda-layout">
        {/* Calendrier */}
        <div className="calendar-section">
          <div className="calendar-card">
            <div className="calendar-header">
              <button
                className="month-nav-button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                ←
              </button>
              <h2 className="current-month">{monthName}</h2>
              <button
                className="month-nav-button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                →
              </button>
            </div>

            <div className="calendar-weekdays">
              {weekDays.map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDay.get(dayKey) || []
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={dayKey}
                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                  >
                    <div className="day-number">{format(day, 'd')}</div>
                    {dayEvents.length > 0 && (
                      <div className="day-events">
                        {dayEvents.map((stat, idx) => (
                          <div
                            key={idx}
                            className="day-event-dot"
                            style={{
                              backgroundColor: getSaturationColor(stat.responsePercentage),
                            }}
                            title={stat.event.title}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Détails du jour sélectionné */}
        <div className="events-detail-section">
          {selectedDate ? (
            <div className="events-detail-card">
              <div className="detail-header">
                <h2>{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</h2>
                <button
                  className="close-detail"
                  onClick={() => setSelectedDate(null)}
                >
                  ✕
                </button>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="events-list">
                  {selectedDateEvents.map((stat) => (
                    <div key={stat.event.id} className="event-detail-item">
                      <div className="event-detail-header">
                        <div>
                          <h3>{stat.event.title}</h3>
                          <p className="event-time">{formatEventTime(stat.event.date)}</p>
                          {stat.event.location && <p className="event-location">{stat.event.location}</p>}
                        </div>
                        <span
                          className="participation-badge"
                          style={{ backgroundColor: getSaturationColor(stat.responsePercentage) }}
                        >
                          {stat.responsePercentage}%
                        </span>
                      </div>

                      {stat.event.description && (
                        <p className="event-description">{stat.event.description}</p>
                      )}

                      <div className="event-meta">
                        {stat.event.organizer && <span>👤 {stat.event.organizer}</span>}
                        {stat.event.price && <span>💰 {stat.event.price}</span>}
                      </div>

                      {stat.event.setlist && (
                        <div className="setlist-section">
                          <h4>🎵 Setlist</h4>
                          <ol className="setlist-items">
                            {stat.event.setlist.split('\n').filter(s => s.trim()).map((song, index) => (
                              <li key={index}>{song.trim()}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="event-stats-row">
                        <div className="stat-box">
                          <span className="stat-label">Assignés</span>
                          <span className="stat-value">{stat.totalAssignments}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Réponses</span>
                          <span className="stat-value">{stat.totalResponses}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-label">Taux</span>
                          <span className="stat-value" style={{ color: getSaturationColor(stat.responsePercentage) }}>
                            {stat.responsePercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Instruments Chart */}
                      {stat.instrumentsStats.length > 0 && (
                        <div className="instruments-section">
                          <h4>Répartition par instrument</h4>
                          <div className="instruments-chart">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Tooltip
                                  formatter={(value: number) => `${value} musicien(s)`}
                                />
                                <Pie
                                  data={stat.instrumentsStats}
                                  dataKey="count"
                                  nameKey="name"
                                  innerRadius={40}
                                  outerRadius={65}
                                  paddingAngle={2}
                                  cy="40%"
                                >
                                  {stat.instrumentsStats.map((entry, index) => (
                                    <Cell
                                      key={`${entry.name}-${index}`}
                                      fill={entry.color ?? '#cbd5f0'}
                                    />
                                  ))}
                                </Pie>
                                <Legend
                                  verticalAlign="bottom"
                                  align="center"
                                  wrapperStyle={{ paddingTop: '10px' }}
                                  formatter={(value: string, entry: any) =>
                                    `${value} (${entry?.payload?.count ?? 0})`
                                  }
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Response breakdown */}
                      {Object.keys(stat.responsesByStatus).length > 0 && (
                        <div className="response-breakdown">
                          <p className="breakdown-title">Détail des réponses :</p>
                          <div className="breakdown-items">
                            {Object.entries(stat.responsesByStatus).map(([label, count]) => (
                              <span key={label} className="breakdown-item">
                                {label}: <strong>{count}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-events">Aucun événement ce jour.</p>
              )}
            </div>
          ) : (
            <div className="events-detail-card empty">
              <p className="no-selection">Sélectionnez un jour pour voir les événements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
