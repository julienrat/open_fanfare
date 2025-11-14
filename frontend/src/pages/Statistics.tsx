import { useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEvents, useSections } from '../api/queries'

export const StatisticsPage = () => {
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: sections, isLoading: sectionsLoading } = useSections()

  const sortedEvents = useMemo(
    () =>
      (events ?? [])
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  )

  const statsData = useMemo(() => {
    if (!events || !sections) return null

    // Créer une map pour compter les présents par section et par événement
    const stats = new Map<number | string, Map<number, number>>()

    // Initialiser avec toutes les sections
    sections.forEach((section) => {
      stats.set(section.id, new Map())
    })
    // Ajouter une ligne pour "Sans pupitre"
    stats.set('none', new Map())

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
        const section = presence.musician.instrument.section
        const sectionKey = section ? section.id : 'none'
        
        if (!stats.has(sectionKey)) {
          stats.set(sectionKey, new Map())
        }
        
        const sectionStats = stats.get(sectionKey)!
        const currentCount = sectionStats.get(event.id) || 0
        sectionStats.set(event.id, currentCount + 1)
      })
    })

    return stats
  }, [events, sections, sortedEvents])

  const columnTotals = useMemo(() => {
    if (!statsData || !sortedEvents) return new Map<number, number>()

    const totals = new Map<number, number>()
    
    sortedEvents.forEach((event) => {
      let total = 0
      statsData.forEach((sectionStats) => {
        total += sectionStats.get(event.id) || 0
      })
      totals.set(event.id, total)
    })

    return totals
  }, [statsData, sortedEvents])

  if (eventsLoading || sectionsLoading) {
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
      <h1 className="page-title">Statistiques par pupitre</h1>
      <p className="page-subtitle">
        Nombre de musiciens présents par pupitre et par concert
      </p>

      <div className="stats-table-wrapper">
        <table className="stats-table">
          <thead>
            <tr>
              <th className="sticky-col">Pupitre</th>
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
              <th className="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {sections?.map((section) => {
              const sectionStats = statsData?.get(section.id)
              const rowTotal = sortedEvents.reduce(
                (sum, event) => sum + (sectionStats?.get(event.id) || 0),
                0
              )

              return (
                <tr key={section.id}>
                  <td className="sticky-col section-name">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: section.color ?? '#94a3b8' }}
                    />
                    {section.name}
                  </td>
                  {sortedEvents.map((event) => {
                    const count = sectionStats?.get(event.id) || 0
                    return (
                      <td key={event.id} className="stats-cell">
                        {count > 0 ? count : '-'}
                      </td>
                    )
                  })}
                  <td className="total-col">{rowTotal}</td>
                </tr>
              )
            })}
            {/* Ligne "Sans pupitre" */}
            {(() => {
              const noneStats = statsData?.get('none')
              const hasData = sortedEvents.some((event) => (noneStats?.get(event.id) || 0) > 0)
              
              if (!hasData) return null

              const rowTotal = sortedEvents.reduce(
                (sum, event) => sum + (noneStats?.get(event.id) || 0),
                0
              )

              return (
                <tr>
                  <td className="sticky-col section-name">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: '#94a3b8' }}
                    />
                    Sans pupitre
                  </td>
                  {sortedEvents.map((event) => {
                    const count = noneStats?.get(event.id) || 0
                    return (
                      <td key={event.id} className="stats-cell">
                        {count > 0 ? count : '-'}
                      </td>
                    )
                  })}
                  <td className="total-col">{rowTotal}</td>
                </tr>
              )
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col total-row">Total</td>
              {sortedEvents.map((event) => (
                <td key={event.id} className="total-row">
                  {columnTotals.get(event.id) || 0}
                </td>
              ))}
              <td className="total-col total-row">
                {Array.from(columnTotals.values()).reduce((sum, val) => sum + val, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
