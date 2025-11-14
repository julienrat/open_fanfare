import type { AttendanceStatus, Event, Instrument, Musician, Presence, Section } from './types'

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit & { adminSecret?: string }
): Promise<T> => {
  const { adminSecret, headers, ...rest } = init ?? {}
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
      ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data?.message ?? 'Erreur API')
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  listInstruments: () => apiFetch<Instrument[]>('/api/instruments'),
  createInstrument: (payload: Partial<Instrument>, adminSecret: string) =>
    apiFetch<Instrument>('/api/instruments', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  updateInstrument: (
    id: number,
    payload: Partial<Instrument>,
    adminSecret: string
  ) =>
    apiFetch<Instrument>(`/api/instruments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  deleteInstrument: (id: number, adminSecret: string) =>
    apiFetch<void>(`/api/instruments/${id}`, {
      method: 'DELETE',
      adminSecret,
    }),

  listMusicians: () => apiFetch<Musician[]>('/api/musicians'),
  createMusician: (payload: Partial<Musician>, adminSecret: string) =>
    apiFetch<Musician>('/api/musicians', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  updateMusician: (
    id: number,
    payload: Partial<Musician>,
    adminSecret: string
  ) =>
    apiFetch<Musician>(`/api/musicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  deleteMusician: (id: number, adminSecret: string) =>
    apiFetch<void>(`/api/musicians/${id}`, {
      method: 'DELETE',
      adminSecret,
    }),
  importMusicians: (
    payload: { csv: string; delimiter?: string; hasHeader?: boolean },
    adminSecret: string
  ) =>
    apiFetch<{
      created: number
      updated: number
      skipped: number
      errors: string[]
    }>('/api/musicians/import', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),

  listEvents: () => apiFetch<Event[]>('/api/events'),
  createEvent: (
    payload: {
      title: string
      description?: string | null
      date: string
      location?: string | null
      price?: string | null
      organizer?: string | null
      musicianIds?: number[]
    },
    adminSecret: string
  ) =>
    apiFetch<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  updateEvent: (
    id: number,
    payload: Partial<{
      title: string
      description?: string | null
      date: string
      location?: string | null
      price?: string | null
      organizer?: string | null
      musicianIds?: number[]
    }>,
    adminSecret: string
  ) =>
    apiFetch<Event>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  deleteEvent: (id: number, adminSecret: string) =>
    apiFetch<void>(`/api/events/${id}`, {
      method: 'DELETE',
      adminSecret,
    }),

  listStatuses: () => apiFetch<AttendanceStatus[]>('/api/statuses'),
  createStatus: (
    payload: Partial<AttendanceStatus>,
    adminSecret: string
  ) =>
    apiFetch<AttendanceStatus>('/api/statuses', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  updateStatus: (
    id: number,
    payload: Partial<AttendanceStatus>,
    adminSecret: string
  ) =>
    apiFetch<AttendanceStatus>(`/api/statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  deleteStatus: (id: number, adminSecret: string) =>
    apiFetch<void>(`/api/statuses/${id}`, {
      method: 'DELETE',
      adminSecret,
    }),

  listSections: () => apiFetch<Section[]>('/api/sections'),
  createSection: (payload: Partial<Section>, adminSecret: string) =>
    apiFetch<Section>('/api/sections', {
      method: 'POST',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  updateSection: (
    id: number,
    payload: Partial<Section>,
    adminSecret: string
  ) =>
    apiFetch<Section>(`/api/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      adminSecret,
    }),
  deleteSection: (id: number, adminSecret: string) =>
    apiFetch<void>(`/api/sections/${id}`, {
      method: 'DELETE',
      adminSecret,
    }),

  submitPresence: (
    eventId: number,
    payload: {
      musicianId?: number
      firstName?: string
      lastName?: string
      statusId: number
      comment?: string | null
    }
  ) =>
    apiFetch<Presence>(`/api/events/${eventId}/presences`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

