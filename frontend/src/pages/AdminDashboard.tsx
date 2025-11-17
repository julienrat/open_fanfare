import { useMemo, useState } from 'react'
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
import type { Event, Instrument, Musician, Section } from '../api/types'
import { Modal } from '../components/Modal'

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

  // Modal states
  const [sectionModal, setSectionModal] = useState<{ open: boolean; section: Section | null }>({
    open: false,
    section: null,
  })
  const [instrumentModal, setInstrumentModal] = useState<{ open: boolean; instrument: Instrument | null }>({
    open: false,
    instrument: null,
  })
  const [musicianModal, setMusicianModal] = useState<{ open: boolean; musician: Musician | null }>({
    open: false,
    musician: null,
  })
  const [eventModal, setEventModal] = useState<{ open: boolean; event: Event | null }>({
    open: false,
    event: null,
  })
  const [importModal, setImportModal] = useState(false)

  // List visibility states
  const [showSectionsList, setShowSectionsList] = useState(false)
  const [showInstrumentsList, setShowInstrumentsList] = useState(false)
  const [showMusiciansList, setShowMusiciansList] = useState(false)
  const [showEventsList, setShowEventsList] = useState(false)

  // Form states
  const [sectionForm, setSectionForm] = useState({ name: '', color: '' })
  const [instrumentForm, setInstrumentForm] = useState({ name: '', color: '', sectionId: '' })
  const [musicianForm, setMusicianForm] = useState({
    firstName: '',
    lastName: '',
    instrumentId: '',
    color: '',
    email: '',
    phone: '',
  })
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    organizer: '',
    setlist: '',
  })

  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const sortedEvents = useMemo(
    () =>
      (events ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  )

  // Section handlers
  const openSectionModal = (section: Section | null = null) => {
    if (section) {
      setSectionForm({ name: section.name, color: section.color ?? '' })
    } else {
      setSectionForm({ name: '', color: '' })
    }
    setSectionModal({ open: true, section })
  }

  const closeSectionModal = () => {
    setSectionModal({ open: false, section: null })
    setSectionForm({ name: '', color: '' })
  }

  const handleSubmitSection = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        name: sectionForm.name,
        color: sectionForm.color || undefined,
      }

      if (sectionModal.section) {
        await updateSection.mutateAsync({ id: sectionModal.section.id, payload })
      } else {
        await createSection.mutateAsync(payload)
      }
      closeSectionModal()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleDeleteSection = async (id: number) => {
    if (window.confirm('Supprimer ce pupitre ?')) {
      await deleteSection.mutateAsync(id)
      closeSectionModal()
    }
  }

  // Instrument handlers
  const openInstrumentModal = (instrument: Instrument | null = null) => {
    if (instrument) {
      setInstrumentForm({
        name: instrument.name,
        color: instrument.color ?? '',
        sectionId: instrument.sectionId ? String(instrument.sectionId) : '',
      })
    } else {
      setInstrumentForm({ name: '', color: '', sectionId: '' })
    }
    setInstrumentModal({ open: true, instrument })
  }

  const closeInstrumentModal = () => {
    setInstrumentModal({ open: false, instrument: null })
    setInstrumentForm({ name: '', color: '', sectionId: '' })
  }

  const handleSubmitInstrument = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        name: instrumentForm.name,
        color: instrumentForm.color || undefined,
        sectionId: instrumentForm.sectionId ? Number(instrumentForm.sectionId) : undefined,
      }

      if (instrumentModal.instrument) {
        await updateInstrument.mutateAsync({ id: instrumentModal.instrument.id, payload })
      } else {
        await createInstrument.mutateAsync(payload)
      }
      closeInstrumentModal()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleDeleteInstrument = async (id: number) => {
    if (window.confirm('Supprimer cet instrument ?')) {
      await deleteInstrument.mutateAsync(id)
      closeInstrumentModal()
    }
  }

  // Musician handlers
  const openMusicianModal = (musician: Musician | null = null) => {
    if (musician) {
      setMusicianForm({
        firstName: musician.firstName,
        lastName: musician.lastName,
        instrumentId: String(musician.instrumentId),
        color: musician.color ?? '',
        email: musician.email ?? '',
        phone: musician.phone ?? '',
      })
    } else {
      setMusicianForm({
        firstName: '',
        lastName: '',
        instrumentId: '',
        color: '',
        email: '',
        phone: '',
      })
    }
    setMusicianModal({ open: true, musician })
  }

  const closeMusicianModal = () => {
    setMusicianModal({ open: false, musician: null })
    setMusicianForm({
      firstName: '',
      lastName: '',
      instrumentId: '',
      color: '',
      email: '',
      phone: '',
    })
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

      if (musicianModal.musician) {
        await updateMusician.mutateAsync({ id: musicianModal.musician.id, payload })
      } else {
        await createMusician.mutateAsync(payload)
      }
      closeMusicianModal()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleDeleteMusician = async (id: number) => {
    if (window.confirm('Supprimer ce musicien ?')) {
      await deleteMusician.mutateAsync(id)
      closeMusicianModal()
    }
  }

  // Event handlers
  const openEventModal = (event: Event | null = null) => {
    if (event) {
      setEventForm({
        title: event.title,
        description: event.description ?? '',
        date: toDateTimeLocalValue(event.date),
        location: event.location ?? '',
        price: event.price ?? '',
        organizer: event.organizer ?? '',
        setlist: event.setlist ?? '',
      })
    } else {
      setEventForm({
        title: '',
        description: '',
        date: '',
        location: '',
        price: '',
        organizer: '',
        setlist: '',
      })
    }
    setEventModal({ open: true, event })
  }

  const closeEventModal = () => {
    setEventModal({ open: false, event: null })
    setEventForm({
      title: '',
      description: '',
      date: '',
      location: '',
      price: '',
      organizer: '',
      setlist: '',
    })
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
        setlist: eventForm.setlist || undefined,
      }

      if (eventModal.event) {
        await updateEvent.mutateAsync({ id: eventModal.event.id, payload })
      } else {
        await createEvent.mutateAsync(payload)
      }
      closeEventModal()
    } catch (error) {
      window.alert((error as Error).message)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('Supprimer ce concert ?')) {
      await deleteEvent.mutateAsync(id)
      closeEventModal()
    }
  }

  // Import handler
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

  return (
    <div className="page admin-page">
      <div className="admin-header-wrapper">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">
            Gérez les pupitres, instruments, musiciens et concerts de la fanfare.
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={onLogout}>
          🚪 Déconnexion
        </button>
      </div>

      <div className="admin-grid">
        {/* Pupitres */}
        <article className="admin-card">
          <header className="admin-card-header">
            <div>
              <h2>Pupitres</h2>
              <p className="muted-text">{(sections ?? []).length} pupitre(s)</p>
            </div>
            <button
              type="button"
              className="add-button"
              onClick={() => openSectionModal()}
              title="Ajouter un pupitre"
            >
              +
            </button>
          </header>
          {showSectionsList && (
            <ul className="items-list">
              {(sections ?? []).map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className="item-card"
                    onClick={() => openSectionModal(section)}
                  >
                    <span
                      className="color-dot"
                      style={{ backgroundColor: section.color ?? '#c4b5fd' }}
                      aria-hidden
                    />
                    <strong>{section.name}</strong>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowSectionsList((prev) => !prev)}
            >
              {showSectionsList ? 'Masquer la liste' : 'Afficher la liste'}
            </button>
          </div>
        </article>

        {/* Instruments */}
        <article className="admin-card">
          <header className="admin-card-header">
            <div>
              <h2>Instruments</h2>
              <p className="muted-text">{(instruments ?? []).length} instrument(s)</p>
            </div>
            <button
              type="button"
              className="add-button"
              onClick={() => openInstrumentModal()}
              title="Ajouter un instrument"
            >
              +
            </button>
          </header>
          {showInstrumentsList && (
            <ul className="items-list">
              {(instruments ?? []).map((instrument) => (
                <li key={instrument.id}>
                  <button
                    type="button"
                    className="item-card"
                    onClick={() => openInstrumentModal(instrument)}
                  >
                    <span
                      className="color-dot"
                      style={{ backgroundColor: instrument.color ?? '#c4b5fd' }}
                      aria-hidden
                    />
                    <strong>{instrument.name}</strong>
                    {instrument.section && <span className="chip">{instrument.section.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowInstrumentsList((prev) => !prev)}
            >
              {showInstrumentsList ? 'Masquer la liste' : 'Afficher la liste'}
            </button>
          </div>
        </article>

        {/* Musiciens */}
        <article className="admin-card">
          <header className="admin-card-header">
            <div>
              <h2>Musiciens</h2>
              <p className="muted-text">{(musicians ?? []).length} musicien(s)</p>
            </div>
            <div className="action-group">
              <button
                type="button"
                className="ghost-button small"
                onClick={() => setImportModal(true)}
                title="Importer depuis CSV"
              >
                📄 CSV
              </button>
              <button
                type="button"
                className="add-button"
                onClick={() => openMusicianModal()}
                title="Ajouter un musicien"
              >
                +
              </button>
            </div>
          </header>
          {showMusiciansList && (
            <ul className="items-list">
              {(musicians ?? []).map((musician) => (
                <li key={musician.id}>
                  <button
                    type="button"
                    className="item-card"
                    onClick={() => openMusicianModal(musician)}
                  >
                    <strong>
                      {musician.firstName} {musician.lastName}
                    </strong>
                    <span className="chip">{musician.instrument.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowMusiciansList((prev) => !prev)}
            >
              {showMusiciansList ? 'Masquer la liste' : 'Afficher la liste'}
            </button>
          </div>
        </article>

        {/* Concerts */}
        <article className="admin-card full-width">
          <header className="admin-card-header">
            <div>
              <h2>Concerts</h2>
              <p className="muted-text">{sortedEvents.length} concert(s)</p>
            </div>
            <div className="action-group">
              <button
                type="button"
                className="ghost-button small"
                onClick={() => {
                  if (sortedEvents.length === 0) {
                    alert('Aucun concert à exporter')
                    return
                  }
                  try {
                    downloadICalFile(sortedEvents)
                  } catch (error) {
                    console.error('Erreur lors de l\'export iCal:', error)
                    alert('Erreur lors de l\'export iCal')
                  }
                }}
                title="Exporter tous les concerts au format iCal"
                disabled={sortedEvents.length === 0}
              >
                📅 iCal
              </button>
              <button
                type="button"
                className="add-button"
                onClick={() => openEventModal()}
                title="Ajouter un concert"
              >
                +
              </button>
            </div>
          </header>
          {showEventsList && (
            <div className="events-table-wrapper">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Date</th>
                    <th>Lieu</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((concert) => (
                    <tr key={concert.id} onClick={() => openEventModal(concert)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="event-title-cell">
                          <strong>{concert.title}</strong>
                          {concert.description && (
                            <span className="event-description-preview">{concert.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="event-date-cell">{formatDate(concert.date)}</div>
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
                    </tr>
                  ))}
                  {sortedEvents.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Aucun concert. Cliquez sur + pour créer un concert.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowEventsList((prev) => !prev)}
            >
              {showEventsList ? 'Masquer la liste' : 'Afficher la liste'}
            </button>
          </div>
        </article>
      </div>

      {/* Section Modal */}
      <Modal isOpen={sectionModal.open} onClose={closeSectionModal}>
        <h2>{sectionModal.section ? 'Modifier le pupitre' : 'Nouveau pupitre'}</h2>
        <form className="form" onSubmit={handleSubmitSection}>
          <label className="form-field">
            <span>Nom</span>
            <input
              value={sectionForm.name}
              onChange={(e) => setSectionForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              autoFocus
            />
          </label>
          <label className="form-field">
            <span>Couleur (hex)</span>
            <input
              value={sectionForm.color}
              onChange={(e) => setSectionForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="#60a5fa"
            />
          </label>
          <div className="form-actions">
            {sectionModal.section && (
              <button
                type="button"
                className="ghost-button delete-button"
                onClick={() => handleDeleteSection(sectionModal.section!.id)}
              >
                Supprimer
              </button>
            )}
            <button type="button" className="ghost-button" onClick={closeSectionModal}>
              Annuler
            </button>
            <button type="submit" className="primary-button">
              {sectionModal.section ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Instrument Modal */}
      <Modal isOpen={instrumentModal.open} onClose={closeInstrumentModal}>
        <h2>{instrumentModal.instrument ? 'Modifier l instrument' : 'Nouvel instrument'}</h2>
        <form className="form" onSubmit={handleSubmitInstrument}>
          <label className="form-field">
            <span>Nom</span>
            <input
              value={instrumentForm.name}
              onChange={(e) => setInstrumentForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              autoFocus
            />
          </label>
          <label className="form-field">
            <span>Pupitre</span>
            <select
              value={instrumentForm.sectionId}
              onChange={(e) => setInstrumentForm((prev) => ({ ...prev, sectionId: e.target.value }))}
            >
              <option value="">Aucun</option>
              {(sections ?? []).map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Couleur (hex)</span>
            <input
              value={instrumentForm.color}
              onChange={(e) => setInstrumentForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="#60a5fa"
            />
          </label>
          <div className="form-actions">
            {instrumentModal.instrument && (
              <button
                type="button"
                className="ghost-button delete-button"
                onClick={() => handleDeleteInstrument(instrumentModal.instrument!.id)}
              >
                Supprimer
              </button>
            )}
            <button type="button" className="ghost-button" onClick={closeInstrumentModal}>
              Annuler
            </button>
            <button type="submit" className="primary-button">
              {instrumentModal.instrument ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Musician Modal */}
      <Modal isOpen={musicianModal.open} onClose={closeMusicianModal}>
        <h2>{musicianModal.musician ? 'Modifier le musicien' : 'Nouveau musicien'}</h2>
        <form className="form" onSubmit={handleSubmitMusician}>
          <div className="form-grid">
            <label className="form-field">
              <span>Prénom</span>
              <input
                value={musicianForm.firstName}
                onChange={(e) => setMusicianForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                autoFocus
              />
            </label>
            <label className="form-field">
              <span>Nom</span>
              <input
                value={musicianForm.lastName}
                onChange={(e) => setMusicianForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>Instrument</span>
            <select
              value={musicianForm.instrumentId}
              onChange={(e) => setMusicianForm((prev) => ({ ...prev, instrumentId: e.target.value }))}
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
          <div className="form-grid">
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={musicianForm.email}
                onChange={(e) => setMusicianForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="alice@example.com"
              />
            </label>
            <label className="form-field">
              <span>Téléphone</span>
              <input
                value={musicianForm.phone}
                onChange={(e) => setMusicianForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+33600000000"
              />
            </label>
          </div>
          <label className="form-field">
            <span>Couleur (hex)</span>
            <input
              value={musicianForm.color}
              onChange={(e) => setMusicianForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="#f97316"
            />
          </label>
          <div className="form-actions">
            {musicianModal.musician && (
              <button
                type="button"
                className="ghost-button delete-button"
                onClick={() => handleDeleteMusician(musicianModal.musician!.id)}
              >
                Supprimer
              </button>
            )}
            <button type="button" className="ghost-button" onClick={closeMusicianModal}>
              Annuler
            </button>
            <button type="submit" className="primary-button">
              {musicianModal.musician ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Event Modal */}
      <Modal isOpen={eventModal.open} onClose={closeEventModal}>
        <h2>{eventModal.event ? 'Modifier le concert' : 'Nouveau concert'}</h2>
        <form className="form" onSubmit={handleSubmitEvent}>
          <label className="form-field">
            <span>Titre</span>
            <input
              value={eventForm.title}
              onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              autoFocus
            />
          </label>
          <div className="form-grid">
            <label className="form-field">
              <span>Date et heure</span>
              <input
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span>Lieu</span>
              <input
                value={eventForm.location}
                onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Place de la République"
              />
            </label>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Tarif</span>
              <input
                value={eventForm.price}
                onChange={(e) => setEventForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Participation libre, 10€..."
              />
            </label>
            <label className="form-field">
              <span>Organisateur</span>
              <input
                value={eventForm.organizer}
                onChange={(e) => setEventForm((prev) => ({ ...prev, organizer: e.target.value }))}
                placeholder="Association, mairie..."
              />
            </label>
          </div>
          <label className="form-field">
            <span>Description</span>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Détails du concert, programme…"
            />
          </label>
          <label className="form-field">
            <span>Setlist (liste des morceaux)</span>
            <textarea
              value={eventForm.setlist}
              onChange={(e) => setEventForm((prev) => ({ ...prev, setlist: e.target.value }))}
              rows={5}
              placeholder="Une chanson par ligne&#10;Oh When the Saints&#10;La Bamba&#10;New York New York&#10;..."
            />
          </label>
          <p className="muted-text">
            Tous les musiciens disponibles seront automatiquement ajoutés à cet événement.
          </p>
          <div className="form-actions">
            {eventModal.event && (
              <button
                type="button"
                className="ghost-button delete-button"
                onClick={() => handleDeleteEvent(eventModal.event!.id)}
              >
                Supprimer
              </button>
            )}
            <button type="button" className="ghost-button" onClick={closeEventModal}>
              Annuler
            </button>
            <button type="submit" className="primary-button">
              {eventModal.event ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={importModal} onClose={() => setImportModal(false)}>
        <h2>Importer des musiciens</h2>
        <div className="import-block">
          <p className="import-help">
            Format attendu : <code>nom;prenom;instrument;mail;telephone</code> avec une première ligne d en-tête.
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
            {importSummary && <span className="import-summary">{importSummary}</span>}
          </div>
          {importErrors.length > 0 && (
            <ul className="import-errors">
              {importErrors.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={() => setImportModal(false)}>
            Fermer
          </button>
        </div>
      </Modal>
    </div>
  )
}
