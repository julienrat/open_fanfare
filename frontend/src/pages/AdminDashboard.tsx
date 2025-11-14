import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  useAdminMutations,
  useEvents,
  useInstruments,
  useMusicians,
  useSections,
} from '../api/queries'
import { downloadICalFile } from '../api/icalExport'
import type { Event } from '../api/types'

const toDateTimeLocalValue = (isoDate: string) => {
  const date = new Date(isoDate)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

const formatDate = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: fr })

interface AdminDashboardPageProps {
  onLogout: () => void
}

export const AdminDashboardPage = ({ onLogout }: AdminDashboardPageProps) => {
  const { data: instruments } = useInstruments()
  const { data: musicians } = useMusicians()
  const { data: events } = useEvents()
  const { data: sections } = useSections()

  const {
    createInstrument,
    updateInstrument,
    deleteInstrument,
    createMusician,
    updateMusician,
    deleteMusician,
    createEvent,
    updateEvent,
    deleteEvent,
    importMusicians,
    createSection,
    updateSection,
    deleteSection,
  } = useAdminMutations()

  const [sectionForm, setSectionForm] = useState({
    name: '',
    color: '',
  })
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
  const [showSectionsList, setShowSectionsList] = useState(false)

  const [instrumentForm, setInstrumentForm] = useState({
    name: '',
    color: '',
    sectionId: '',
  })
  const [editingInstrumentId, setEditingInstrumentId] = useState<number | null>(null)

  const [showMusiciansList, setShowMusiciansList] = useState(false)

  const [musicianForm, setMusicianForm] = useState({
    firstName: '',
    lastName: '',
    instrumentId: '',
    color: '',
    email: '',
    phone: '',
  })
  const [editingMusicianId, setEditingMusicianId] = useState<number | null>(null)
  const [showInstrumentsList, setShowInstrumentsList] = useState(false)

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    organizer: '',
  })
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const sortedEvents = useMemo(
    () =>
      (events ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  )

  const handleSubmitSection = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        name: sectionForm.name,
        color: sectionForm.color || undefined,
      }

      if (editingSectionId) {
        await updateSection.mutateAsync({ id: editingSectionId, payload })
      } else {
        await createSection.mutateAsync(payload)
      }

      setSectionForm({ name: '', color: '' })
      setEditingSectionId(null)
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleSubmitInstrument = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        name: instrumentForm.name,
        color: instrumentForm.color || undefined,
        sectionId: instrumentForm.sectionId ? Number(instrumentForm.sectionId) : undefined,
      }

      if (editingInstrumentId) {
        await updateInstrument.mutateAsync({ id: editingInstrumentId, payload })
      } else {
        await createInstrument.mutateAsync(payload)
      }

      setInstrumentForm({ name: '', color: '', sectionId: '' })
      setEditingInstrumentId(null)
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleSubmitMusician = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        firstName: musicianForm.firstName,
        lastName: musicianForm.lastName,
        instrumentId: Number(musicianForm.instrumentId),
        color: musicianForm.color || undefined,
        email: musicianForm.email || undefined,
        phone: musicianForm.phone || undefined,
      }

      if (editingMusicianId) {
        await updateMusician.mutateAsync({ id: editingMusicianId, payload })
      } else {
        await createMusician.mutateAsync(payload)
      }

      setMusicianForm({
        firstName: '',
        lastName: '',
        instrumentId: '',
        color: '',
        email: '',
        phone: '',
      })
      setEditingMusicianId(null)
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      location: '',
      price: '',
      organizer: '',
    })
    setEditingEventId(null)
  }

  const handleSubmitEvent = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        title: eventForm.title,
        description: eventForm.description || undefined,
        date: new Date(eventForm.date).toISOString(),
        location: eventForm.location || undefined,
        price: eventForm.price || undefined,
        organizer: eventForm.organizer || undefined,
      }

      if (editingEventId) {
        await updateEvent.mutateAsync({ id: editingEventId, payload })
      } else {
        await createEvent.mutateAsync(payload)
      }

      resetEventForm()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleDeleteEvent = (eventToDelete: Event) => {
    if (
      window.confirm(`Supprimer l'événement "${eventToDelete.title}" du ${formatDate(eventToDelete.date)} ?`)
    ) {
      deleteEvent.mutate(eventToDelete.id)
      if (editingEventId === eventToDelete.id) {
        resetEventForm()
      }
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportSummary(null)
    setImportErrors([])

    try {
      const content = await file.text()
      const result = await importMusicians.mutateAsync({
        csv: content,
        delimiter: ';',
        hasHeader: true,
      })
      setImportSummary(
        `Import terminé : ${result.created} créé(s), ${result.updated} mis à jour, ${result.skipped} ignoré(s).`
      )
      setImportErrors(result.errors)
    } catch (error) {
      window.alert((error as Error).message)
    } finally {
      event.target.value = ''
    }
  }

  // Pré-cocher tous les musiciens lors de la création
  useEffect(() => {
    if (!editingEventId) return
    if (!events) return
    const current = events.find((event) => event.id === editingEventId)
    if (!current) return
    setEventForm({
      title: current.title,
      description: current.description ?? '',
      date: toDateTimeLocalValue(current.date),
      location: current.location ?? '',
      price: current.price ?? '',
      organizer: current.organizer ?? '',
    })
  }, [editingEventId, events])

  return (
    <div className="page admin-page">
      <div className="admin-header-wrapper">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">
            Gérez les référentiels (statuts, instruments, musiciens) et organisez les concerts.
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={onLogout}>
          🚪 Déconnexion
        </button>
      </div>

      <section className="admin-grid">
        <article className="admin-card">
          <header className="admin-card-header">
            <h2>Pupitres</h2>
            <p>Créez les pupitres pour regrouper les instruments.</p>
          </header>
          <div className="admin-card-content">
            <form className="form" onSubmit={handleSubmitSection}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Nom</span>
                  <input
                    value={sectionForm.name}
                    onChange={(event) =>
                      setSectionForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Couleur (hex)</span>
                  <input
                    value={sectionForm.color}
                    onChange={(event) =>
                      setSectionForm((prev) => ({ ...prev, color: event.target.value }))
                    }
                    placeholder="#60a5fa"
                  />
                </label>
              </div>
              <div className="form-actions">
                {editingSectionId ? (
                  <>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingSectionId(null)
                        setSectionForm({ name: '', color: '' })
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={updateSection.isPending}
                    >
                      {updateSection.isPending ? 'Mise à jour…' : 'Mettre à jour'}
                    </button>
                  </>
                ) : (
                  <button type="submit" className="primary-button" disabled={createSection.isPending}>
                    {createSection.isPending ? 'Ajout…' : 'Ajouter'}
                  </button>
                )}
              </div>
            </form>

            {showSectionsList ? (
              <ul className="items-list">
                {(sections ?? []).map((section) => (
                  <li key={section.id}>
                    <div className="item-line">
                      <div className="item-meta">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: section.color ?? '#c4b5fd' }}
                          aria-hidden
                        />
                        <strong>{section.name}</strong>
                      </div>
                      <div className="action-group">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            setEditingSectionId(section.id)
                            setSectionForm({
                              name: section.name,
                              color: section.color ?? '',
                            })
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => deleteSection.mutate(section.id)}
                          disabled={deleteSection.isPending}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowSectionsList((prev) => !prev)}
              >
                {showSectionsList
                  ? 'Masquer la liste'
                  : `Afficher la liste (${(sections ?? []).length} pupitre${(sections ?? []).length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="admin-card">
          <header className="admin-card-header">
            <h2>Instruments</h2>
            <p>Créez les instruments disponibles pour les musiciens.</p>
          </header>
          <div className="admin-card-content">
            <form className="form" onSubmit={handleSubmitInstrument}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Nom</span>
                  <input
                    value={instrumentForm.name}
                    onChange={(event) =>
                      setInstrumentForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Couleur (hex)</span>
                  <input
                    value={instrumentForm.color}
                    onChange={(event) =>
                      setInstrumentForm((prev) => ({ ...prev, color: event.target.value }))
                    }
                    placeholder="#60a5fa"
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Pupitre</span>
                <select
                  value={instrumentForm.sectionId}
                  onChange={(event) =>
                    setInstrumentForm((prev) => ({ ...prev, sectionId: event.target.value }))
                  }
                >
                  <option value="">Aucun</option>
                  {(sections ?? []).map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions">
                {editingInstrumentId ? (
                  <>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingInstrumentId(null)
                        setInstrumentForm({ name: '', color: '', sectionId: '' })
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={updateInstrument.isPending}
                    >
                      {updateInstrument.isPending ? 'Mise à jour…' : 'Mettre à jour'}
                    </button>
                  </>
                ) : (
                  <button type="submit" className="primary-button" disabled={createInstrument.isPending}>
                    {createInstrument.isPending ? 'Ajout…' : 'Ajouter'}
                  </button>
                )}
              </div>
            </form>

            {showInstrumentsList ? (
              <ul className="items-list">
                {(instruments ?? []).map((instrument) => (
                  <li key={instrument.id}>
                    <div className="item-line">
                      <div className="item-meta">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: instrument.color ?? '#c4b5fd' }}
                          aria-hidden
                        />
                        <strong>{instrument.name}</strong>
                        {instrument.section && (
                          <span className="chip">{instrument.section.name}</span>
                        )}
                      </div>
                      <div className="action-group">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            setEditingInstrumentId(instrument.id)
                            setInstrumentForm({
                              name: instrument.name,
                              color: instrument.color ?? '',
                              sectionId: instrument.sectionId ? String(instrument.sectionId) : '',
                            })
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => deleteInstrument.mutate(instrument.id)}
                          disabled={deleteInstrument.isPending}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowInstrumentsList((prev) => !prev)}
              >
                {showInstrumentsList
                  ? 'Masquer la liste'
                  : `Afficher la liste (${(instruments ?? []).length} instrument${(instruments ?? []).length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="admin-card">
          <header className="admin-card-header">
            <h2>Musiciens</h2>
            <p>Ajoutez ou retirez des musiciens de la fanfare.</p>
          </header>
          <div className="admin-card-content">
            <form className="form" onSubmit={handleSubmitMusician}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Prénom</span>
                  <input
                    value={musicianForm.firstName}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Nom</span>
                  <input
                    value={musicianForm.lastName}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="form-field">
                  <span>Instrument</span>
                  <select
                    value={musicianForm.instrumentId}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, instrumentId: event.target.value }))
                    }
                    required
                  >
                    <option value="">Choisir…</option>
                    {(instruments ?? []).map((instrument) => (
                      <option key={instrument.id} value={instrument.id}>
                        {instrument.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Couleur (hex)</span>
                  <input
                    value={musicianForm.color}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, color: event.target.value }))
                    }
                    placeholder="#f97316"
                  />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={musicianForm.email}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="alice@example.com"
                  />
                </label>
                <label className="form-field">
                  <span>Téléphone</span>
                  <input
                    value={musicianForm.phone}
                    onChange={(event) =>
                      setMusicianForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+33600000000"
                  />
                </label>
              </div>
              <div className="form-actions">
                {editingMusicianId ? (
                  <>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingMusicianId(null)
                        setMusicianForm({
                          firstName: '',
                          lastName: '',
                          instrumentId: '',
                          color: '',
                          email: '',
                          phone: '',
                        })
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={updateMusician.isPending}
                    >
                      {updateMusician.isPending ? 'Mise à jour…' : 'Mettre à jour'}
                    </button>
                  </>
                ) : (
                  <button type="submit" className="primary-button" disabled={createMusician.isPending}>
                    {createMusician.isPending ? 'Ajout…' : 'Ajouter'}
                  </button>
                )}
              </div>
            </form>

            <div className="import-block">
              <h3>Importer depuis un fichier CSV</h3>
              <p className="import-help">
                Format attendu : <code>nom;prenom;instrument;mail;telephone</code> avec une première ligne d’en-tête.
              </p>
              <div className="import-actions">
                <label className="import-upload">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportFile}
                    disabled={importMusicians.isPending}
                  />
                  <span>{importMusicians.isPending ? 'Import en cours…' : 'Choisir un fichier CSV'}</span>
                </label>
                {importSummary ? <span className="import-summary">{importSummary}</span> : null}
              </div>
              {importErrors.length ? (
                <ul className="import-errors">
                  {importErrors.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {showMusiciansList ? (
              <ul className="items-list">
                {(musicians ?? []).map((musician) => (
                  <li key={musician.id}>
                    <div className="item-line">
                      <div className="item-meta">
                        <strong>
                          {musician.firstName} {musician.lastName}
                        </strong>
                        <span className="chip">{musician.instrument.name}</span>
                        {musician.email ? <span className="muted-text">{musician.email}</span> : null}
                        {musician.phone ? <span className="muted-text">{musician.phone}</span> : null}
                      </div>
                      <div className="action-group">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => {
                            setEditingMusicianId(musician.id)
                            setMusicianForm({
                              firstName: musician.firstName,
                              lastName: musician.lastName,
                              instrumentId: String(musician.instrumentId),
                              color: musician.color ?? '',
                              email: musician.email ?? '',
                              phone: musician.phone ?? '',
                            })
                          }}
                        >
                          Modifier
                        </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => deleteMusician.mutate(musician.id)}
                        disabled={deleteMusician.isPending}
                      >
                        Supprimer
                      </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowMusiciansList((prev) => !prev)}
              >
                {showMusiciansList
                  ? 'Masquer la liste'
                  : `Afficher la liste (${(musicians ?? []).length} musicien${(musicians ?? []).length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* Section Concerts - Pleine largeur */}
      <section className="admin-card full-width">
        <header className="admin-card-header">
          <div>
            <h2>Concerts</h2>
            <p>Organisez les concerts et affectez les musiciens attendus.</p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => downloadICalFile(sortedEvents)}
            title="Exporter tous les concerts au format iCal"
          >
            📅 Exporter iCal
          </button>
        </header>
        <div className="admin-card-content">
          {/* Formulaire */}
          <form className="form" onSubmit={handleSubmitEvent}>
            <label className="form-field">
              <span>Titre</span>
              <input
                value={eventForm.title}
                onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <div className="form-grid">
              <label className="form-field">
                <span>Date et heure</span>
                <input
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </label>
              <label className="form-field">
                <span>Lieu</span>
                <input
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                  placeholder="Ex. Place de la République"
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="form-field">
                <span>Tarif</span>
                <input
                  value={eventForm.price}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="Participation libre, 10€, ..."
                />
              </label>
              <label className="form-field">
                <span>Organisateur</span>
                <input
                  value={eventForm.organizer}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, organizer: event.target.value }))
                  }
                  placeholder="Association, mairie..."
                />
              </label>
            </div>
            <label className="form-field">
              <span>Description</span>
              <textarea
                value={eventForm.description}
                onChange={(event) =>
                  setEventForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                placeholder="Détails du concert, programme…"
              />
            </label>
            <p className="muted-text">
              Tous les musiciens disponibles seront automatiquement ajoutés à cet événement.
            </p>
            <div className="form-actions">
              {editingEventId ? (
                <>
                  <button type="button" className="ghost-button" onClick={resetEventForm}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={updateEvent.isPending}
                  >
                    {updateEvent.isPending ? 'Mise à jour…' : 'Mettre à jour'}
                  </button>
                </>
              ) : (
                <button type="submit" className="primary-button" disabled={createEvent.isPending}>
                  {createEvent.isPending ? 'Création…' : 'Créer'}
                </button>
              )}
            </div>
          </form>

          {/* Tableau en dessous */}
          <div className="events-table-wrapper">
            <table className="events-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Date</th>
                    <th>Lieu</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((concert) => (
                    <tr key={concert.id} className={editingEventId === concert.id ? 'editing' : ''}>
                      <td>
                        <div className="event-title-cell">
                          <strong>{concert.title}</strong>
                          {concert.description && (
                            <span className="event-description-preview">{concert.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="event-date-cell">
                          {formatDate(concert.date)}
                        </div>
                      </td>
                      <td>
                        <div className="event-meta-cell">
                          {concert.location && <span>📍 {concert.location}</span>}
                          {concert.price && <span>💰 {concert.price}</span>}
                          {concert.organizer && <span>👤 {concert.organizer}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge">{concert.assignments.length} musiciens</span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => {
                              setEditingEventId(concert.id)
                              setEventForm({
                                title: concert.title,
                                description: concert.description ?? '',
                                date: toDateTimeLocalValue(concert.date),
                                location: concert.location ?? '',
                                price: concert.price ?? '',
                                organizer: concert.organizer ?? '',
                              })
                              // Scroll to form
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            type="button"
                            className="ghost-button delete-button"
                            onClick={() => handleDeleteEvent(concert)}
                            disabled={deleteEvent.isPending}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedEvents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Aucun concert créé. Créez votre premier concert ci-dessus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </section>
    </div>
  )
}

