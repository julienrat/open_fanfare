import { useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEvents, useInstruments } from '../api/queries'

export const StatisticsPage = () => {
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: instruments, isLoading: instrumentsLoading } = useInstruments()

  const sortedEvents = useMemo(
    () =>
      (events ?? [])
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  )

  const sortedInstruments = useMemo(
    () =>
      (instruments ?? [])
        .slice()
        .sort((a, b) => {
          // Trier par section d'abord, puis par nom d'instrument
          const sectionA = a.section?.name ?? 'ZZZ'
          const sectionB = b.section?.name ?? 'ZZZ'
          if (sectionA !== sectionB) {
            return sectionA.localeCompare(sectionB)
          }
          return a.name.localeCompare(b.name)
        }),
    [instruments]
  )

  const statsData = useMemo(() => {
    if (!events || !instruments) return null

    // Créer une map pour compter les présents par instrument et par événement
    const stats = new Map<number, Map<number, number>>()

    // Initialiser avec tous les instruments
    instruments.forEach((instrument) => {
      stats.set(instrument.id, new Map())
    })

    // Compter les présents pour chaque événement
    sortedEvents.forEach((event) => {
      // Récupérer le statut par défaut (Présent)
      const defaultStatus = event.presences.length > 0
        ? event.presences.find((p) => p.status.isDefault)?.status
        : null

      // Filtrer les présences "Présent"
      const presentPresences = defaultStatus
        ? event.presences.filter((p) => p.statusId === defaultStatus.id)
        : event.presences

      presentPresences.forEach((presence) => {
        const instrumentId = presence.musician.instrument.id
        
        if (!stats.has(instrumentId)) {
          stats.set(instrumentId, new Map())
        }
        
        const instrumentStats = stats.get(instrumentId)!
        const currentCount = instrumentStats.get(event.id) || 0
        instrumentStats.set(event.id, currentCount + 1)
      })
    })

    return stats
  }, [events, instruments, sortedEvents])

  const columnTotals = useMemo(() => {
    if (!statsData || !sortedEvents) return new Map<number, number>()

    const totals = new Map<number, number>()
    
    sortedEvents.forEach((event) => {
      let total = 0
      statsData.forEach((instrumentStats) => {
        total += instrumentStats.get(event.id) || 0
      })
      totals.set(event.id, total)
    })

    return totals
  }, [statsData, sortedEvents])

  if (eventsLoading || instrumentsLoading) {
    return (
      <div className="page">
        <p>Chargement des statistiques…</p>
      </div>
    )
  }

  if (!sortedEvents.length) {
    return (
      <div className="page">
        <h1 className="page-title">Statistiques</h1>
        <p className="page-subtitle">Aucun concert pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Statistiques par instrument</h1>
      <p className="page-subtitle">
        Nombre de musiciens présents par instrument et par concert
      </p>

      <div className="stats-table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th className="sticky-col">Instrument</th>
              {sortedEvents.map((event) => (
                <th key={event.id}>
                  <div className="stats-header">
                    <div className="stats-event-title">{event.title}</div>
                    <div className="stats-event-date">
                      {format(new Date(event.date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedInstruments.map((instrument) => {
              const instrumentStats = statsData?.get(instrument.id)
              const rowTotal = sortedEvents.reduce(
                (sum, event) => sum + (instrumentStats?.get(event.id) || 0),
                0
              )

              // Ne pas afficher les instruments qui n'ont jamais eu de présents
              if (rowTotal === 0) return null

              return (
                <tr key={instrument.id}>
                  <td className="sticky-col">
                    <div className="instrument-name">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: instrument.section?.color ?? '#94a3b8' }}
                      />
                      <span className="instrument-text">
                        {instrument.name}
                        {instrument.section && (
                          <span className="section-label"> ({instrument.section.name})</span>
                        )}
                      </span>
                    </div>
                  </td>
                  {sortedEvents.map((event) => {
                    const count = instrumentStats?.get(event.id) || 0
                    return (
                      <td key={event.id} className="stats-cell">
                        {count > 0 ? count : '-'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col total-row">Total</td>
              {sortedEvents.map((event) => (
                <td key={event.id} className="total-row">
                  {columnTotals.get(event.id) || 0}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
