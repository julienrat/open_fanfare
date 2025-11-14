import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEvents, usePresenceMutation, useStatuses } from '../api/queries'
import type { Event, Musician, Presence } from '../api/types'
import { Modal } from '../components/Modal'

type PresenceFormState = {
  musicianId?: number
  firstName: string
  lastName: string
  statusId?: number
  comment: string
}

const defaultFormState: PresenceFormState = {
  musicianId: undefined,
  firstName: '',
  lastName: '',
  statusId: undefined,
  comment: '',
}

const getPresenceForMusician = (event: Event, musicianId: number) =>
  event.presences.find((presence) => presence.musicianId === musicianId)

const formatEventDate = (date: string) =>
  format(new Date(date), 'EEEE d MMMM yyyy - HH:mm', { locale: fr })

const PresenceStatusChip = ({ presence }: { presence?: Presence }) => {
  if (!presence) {
    return <span className="status-chip pending">En attente</span>
  }

  const background = presence.status.color ?? '#e2e8f0'

  return (
    <span className="status-chip" style={{ background }}>
      {presence.status.label}
    </span>
  )
}

export const PublicEventsPage = () => {
  const { data: events, isLoading, isError } = useEvents()
  const { data: statuses } = useStatuses()
  const presenceMutation = usePresenceMutation()

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [formState, setFormState] = useState<PresenceFormState>(defaultFormState)
  const [selectValue, setSelectValue] = useState<string>('')
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null)

  const defaultStatus = useMemo(
    () => statuses?.find((status) => status.isDefault),
    [statuses]
  )

  const sortedEvents = useMemo(
    () =>
      (events ?? []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  )

  const fallbackColors = ['#22c55e', '#0ea5e9', '#f97316', '#a855f7', '#ef4444', '#facc15']

  const computeSectionData = (event: Event) => {
    const counts = new Map<
      number | string,
      { name: string; color?: string | null; value: number }
    >()

    const appendCount = (sectionId: number | string, name: string, color?: string | null) => {
      const existing = counts.get(sectionId)
      if (existing) {
        existing.value += 1
      } else {
        counts.set(sectionId, { name, color, value: 1 })
      }
    }

    const defaultStatusId = defaultStatus?.id
    const presentPresences =
      defaultStatusId != null
        ? event.presences.filter((presence) => presence.statusId === defaultStatusId)
        : event.presences

    if (presentPresences.length > 0) {
      presentPresences.forEach((presence) => {
        const section = presence.musician.instrument.section
        if (section) {
          appendCount(section.id, section.name, section.color)
        } else {
          appendCount('none', 'Sans pupitre', '#94a3b8')
        }
      })
    } else {
      event.assignments.forEach((assignment) => {
        const section = assignment.musician.instrument.section
        if (section) {
          appendCount(section.id, section.name, section.color)
        } else {
          appendCount('none', 'Sans pupitre', '#94a3b8')
        }
      })
    }

    return Array.from(counts.values()).map((entry, index) => ({
      ...entry,
      color: entry.color ?? fallbackColors[index % fallbackColors.length],
    }))
  }

  const computeParticipationData = (event: Event) => {
    const counts = new Map<
      number,
      { name: string; color?: string | null; value: number }
    >()

    const appendCount = (instrumentId: number, name: string, color?: string | null) => {
      const existing = counts.get(instrumentId)
      if (existing) {
        existing.value += 1
      } else {
        counts.set(instrumentId, { name, color, value: 1 })
      }
    }

    const defaultStatusId = defaultStatus?.id
    const presentPresences =
      defaultStatusId != null
        ? event.presences.filter((presence) => presence.statusId === defaultStatusId)
        : event.presences

    if (presentPresences.length > 0) {
      presentPresences.forEach((presence) => {
        appendCount(
          presence.musician.instrumentId,
          presence.musician.instrument.name,
          presence.musician.instrument.color
        )
      })
    } else {
      event.assignments.forEach((assignment) => {
        appendCount(
          assignment.musician.instrumentId,
          assignment.musician.instrument.name,
          assignment.musician.instrument.color
        )
      })
    }

    return Array.from(counts.values()).map((entry, index) => ({
      ...entry,
      color: entry.color ?? fallbackColors[index % fallbackColors.length],
    }))
  }

  const handleOpenModal = (event: Event) => {
    setSelectedEvent(event)
    setFormState(defaultFormState)
    setSelectValue('')
  }

  const handleCloseModal = () => {
    setSelectedEvent(null)
    setFormState(defaultFormState)
    setSelectValue('')
  }

  const handleSelectMusician = (musician?: Musician) => {
    if (!musician) {
      setFormState((prev) => ({
        ...prev,
        musicianId: undefined,
        firstName: '',
        lastName: '',
      }))
      return
    }

    setFormState((prev) => ({
      ...prev,
      musicianId: musician.id,
      firstName: musician.firstName,
      lastName: musician.lastName,
    }))
  }

  const handleSubmit = async (event: Event) => {
    if (!formState.statusId) return

    try {
      await presenceMutation.mutateAsync({
        eventId: event.id,
        payload: {
          musicianId: formState.musicianId,
          firstName: formState.firstName || undefined,
          lastName: formState.lastName || undefined,
          statusId: formState.statusId,
          comment: formState.comment ? formState.comment : undefined,
        },
      })
      handleCloseModal()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  if (isLoading) {
    return <p>Chargement des événements…</p>
  }

  if (isError) {
    return <p>Impossible de récupérer les événements. Merci de réessayer plus tard.</p>
  }

  if (!sortedEvents.length) {
    return <p>Aucun événement pour le moment. Revenez bientôt !</p>
  }

  return (
    <div className="page">
      <h1 className="page-title">Présences aux concerts</h1>
      <p className="page-subtitle">
        Consultez les concerts à venir et signalez votre présence en quelques clics.
      </p>

      <div className="cards-grid">
        {sortedEvents.map((event) => {
          const chartData = computeParticipationData(event)
          const sectionData = computeSectionData(event)
          const filteredResponsesCount =
            defaultStatus?.id != null
              ? event.presences.filter((presence) => presence.statusId === defaultStatus.id).length
              : event.presences.length
          const hasResponses = filteredResponsesCount > 0

          return (
            <article key={event.id} className="card">
              <header className="card-header">
                <div>
                  <h2>{event.title}</h2>
                  <p className="card-date">{formatEventDate(event.date)}</p>
                  <div className="card-meta">
                    {event.organizer ? <span>Organisateur : {event.organizer}</span> : null}
                    {event.price ? <span>Tarif : {event.price}</span> : null}
                  </div>
                </div>
                {event.location ? <span className="card-location">{event.location}</span> : null}
              </header>

              {event.description ? <p className="card-description">{event.description}</p> : null}

              {event.assignments.length ? (
                <div className="attendance-list">
                  {expandedEventId === event.id
                    ? event.assignments
                        .filter((assignment) => {
                          const presence = getPresenceForMusician(event, assignment.musicianId)
                          return presence !== undefined
                        })
                        .map((assignment) => {
                          const presence = getPresenceForMusician(event, assignment.musicianId)
                          return (
                            <div key={assignment.id} className="attendance-item">
                              <div className="attendance-info">
                                <span className="attendance-name">
                                  {assignment.musician.firstName} {assignment.musician.lastName}
                                </span>
                                <span className="attendance-instrument">
                                  {assignment.musician.instrument.name}
                                </span>
                              </div>
                              <PresenceStatusChip presence={presence} />
                            </div>
                          )
                        })
                    : null}
                  <button
                    type="button"
                    className="ghost-button small"
                    onClick={() =>
                      setExpandedEventId((current) => (current === event.id ? null : event.id))
                    }
                  >
                    {expandedEventId === event.id
                      ? 'Masquer la liste'
                      : `Afficher la liste (${event.assignments.filter((assignment) => getPresenceForMusician(event, assignment.musicianId) !== undefined).length} musicien${event.assignments.filter((assignment) => getPresenceForMusician(event, assignment.musicianId) !== undefined).length > 1 ? 's' : ''} ayant répondu)`}
                  </button>
                </div>
              ) : (
                <p className="chart-empty">Aucun musicien assigné pour le moment.</p>
              )}

              {hasResponses && chartData.length ? (
                <div className="charts-container">
                  <div className="chart-card">
                    <div className="chart-header">
                      <span>Participation par pupitre</span>
                    </div>
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(value: number, name) => [`${value} musicien(s)`, name as string]}
                          />
                          <Pie
                            data={sectionData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                          >
                            {sectionData.map((entry, index) => (
                              <Cell key={`section-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            formatter={(value: string, entry: any) =>
                              `${value} (${entry?.payload?.value ?? 0})`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="chart-header">
                      <span>Participation par instrument</span>
                    </div>
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(value: number, name) => [`${value} musicien(s)`, name as string]}
                          />
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`instrument-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend
                            verticalAlign="bottom"
                            formatter={(value: string, entry: any) =>
                              `${value} (${entry?.payload?.value ?? 0})`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
              {!hasResponses ? (
                <p className="chart-empty">Aucun musicien n'a encore répondu.</p>
              ) : null}

              {event.presences.filter((p) => p.comment).length > 0 && (
                <div className="comments-section">
                  <h3 className="comments-title">Commentaires</h3>
                  <div className="comments-list">
                    {event.presences
                      .filter((p) => p.comment)
                      .map((presence) => (
                        <div key={presence.id} className="comment-item">
                          <div className="comment-header">
                            <strong className="comment-author">
                              {presence.musician.firstName} {presence.musician.lastName}
                            </strong>
                            <span className="comment-instrument">
                              {presence.musician.instrument.name}
                            </span>
                          </div>
                          <p className="comment-text">{presence.comment}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <footer className="card-footer">
                <button type="button" className="primary-button" onClick={() => handleOpenModal(event)}>
                  Je réponds
                </button>
              </footer>
            </article>
          )
        })}
      </div>

      <Modal
        title={selectedEvent ? `Présence - ${selectedEvent.title}` : ''}
        isOpen={Boolean(selectedEvent)}
        onClose={handleCloseModal}
      >
        {selectedEvent && statuses ? (
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit(selectedEvent)
            }}
          >
            <label className="form-field">
              <span>Musicien</span>
              <select
                value={selectValue}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectValue(value)
                  if (value === '__manual__' || value === '') {
                    handleSelectMusician(undefined)
                    return
                  }
                  const musician = selectedEvent.assignments.find(
                    (assignment) => assignment.musicianId === Number(value)
                  )?.musician
                  handleSelectMusician(musician)
                }}
              >
                <option value="">Choisir dans la liste…</option>
                {selectedEvent.assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.musicianId}>
                    {assignment.musician.firstName} {assignment.musician.lastName} (
                    {assignment.musician.instrument.name})
                  </option>
                ))}
                <option value="__manual__">Je ne suis pas dans la liste</option>
              </select>
            </label>

            {!formState.musicianId ? (
              <div className="form-grid">
                <label className="form-field">
                  <span>Prénom</span>
                  <input
                    value={formState.firstName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    placeholder="Prénom"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Nom</span>
                  <input
                    value={formState.lastName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    placeholder="Nom"
                    required
                  />
                </label>
              </div>
            ) : null}

            <fieldset className="form-field">
              <legend>Statut</legend>
              <div className="radio-group">
                {statuses.map((status) => (
                  <label key={status.id} className="radio-option">
                    <input
                      type="radio"
                      name="statusId"
                      value={status.id}
                      checked={formState.statusId === status.id}
                      onChange={() =>
                        setFormState((prev) => ({
                          ...prev,
                          statusId: status.id,
                        }))
                      }
                      required
                    />
                    <span className="radio-label">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: status.color ?? '#cbd5f5' }}
                      />
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="form-field">
              <span>Commentaire (optionnel)</span>
              <textarea
                value={formState.comment}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, comment: event.target.value }))
                }
                rows={3}
                placeholder="Ajoutez une précision si nécessaire…"
              />
            </label>

            <div className="form-actions">
              <button type="button" className="ghost-button" onClick={handleCloseModal}>
                Annuler
              </button>
              <button type="submit" className="primary-button" disabled={presenceMutation.isPending}>
                {presenceMutation.isPending ? 'Envoi…' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        ) : (
          <p>Chargement…</p>
        )}
      </Modal>
    </div>
  )
}

