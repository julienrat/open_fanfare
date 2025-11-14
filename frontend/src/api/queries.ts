import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { AttendanceStatus, Event, Instrument, Musician, Section } from './types'

const keys = {
  instruments: ['instruments'] as const,
  musicians: ['musicians'] as const,
  events: ['events'] as const,
  statuses: ['statuses'] as const,
  sections: ['sections'] as const,
}

export const useInstruments = () =>
  useQuery<Instrument[]>({
    queryKey: keys.instruments,
    queryFn: api.listInstruments,
  })

export const useMusicians = () =>
  useQuery<Musician[]>({
    queryKey: keys.musicians,
    queryFn: api.listMusicians,
  })

export const useEvents = () =>
  useQuery<Event[]>({
    queryKey: keys.events,
    queryFn: api.listEvents,
  })

export const useStatuses = () =>
  useQuery<AttendanceStatus[]>({
    queryKey: keys.statuses,
    queryFn: api.listStatuses,
  })

export const useSections = () =>
  useQuery<Section[]>({
    queryKey: keys.sections,
    queryFn: api.listSections,
  })

export const useAdminMutations = () => {
  const queryClient = useQueryClient()
  const ensureSecret = () => {
    const stored = window.localStorage.getItem('adminSecret')
    if (!stored) {
      throw new Error('Veuillez saisir le mot de passe administrateur.')
    }
    return stored
  }

  return {
    createInstrument: useMutation({
      mutationFn: (payload: Partial<Instrument>) =>
        api.createInstrument(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.instruments })
      },
    }),
    updateInstrument: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<Instrument> }) =>
        api.updateInstrument(id, payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.instruments })
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
      },
    }),
    deleteInstrument: useMutation({
      mutationFn: (id: number) => api.deleteInstrument(id, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.instruments })
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
      },
    }),
    createMusician: useMutation({
      mutationFn: (payload: Partial<Musician>) =>
        api.createMusician(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    updateMusician: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<Musician> }) =>
        api.updateMusician(id, payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    deleteMusician: useMutation({
      mutationFn: (id: number) => api.deleteMusician(id, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    importMusicians: useMutation({
      mutationFn: (payload: { csv: string; delimiter?: string; hasHeader?: boolean }) =>
        api.importMusicians(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.musicians })
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    createEvent: useMutation({
      mutationFn: (payload: Parameters<typeof api.createEvent>[0]) =>
        api.createEvent(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    updateEvent: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof api.updateEvent>[1] }) =>
        api.updateEvent(id, payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    deleteEvent: useMutation({
      mutationFn: (id: number) => api.deleteEvent(id, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.events })
      },
    }),
    createStatus: useMutation({
      mutationFn: (payload: Partial<AttendanceStatus>) =>
        api.createStatus(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.statuses })
      },
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<AttendanceStatus> }) =>
        api.updateStatus(id, payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.statuses })
      },
    }),
    deleteStatus: useMutation({
      mutationFn: (id: number) => api.deleteStatus(id, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.statuses })
      },
    }),
    createSection: useMutation({
      mutationFn: (payload: Partial<Section>) =>
        api.createSection(payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.sections })
      },
    }),
    updateSection: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<Section> }) =>
        api.updateSection(id, payload, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.sections })
        void queryClient.invalidateQueries({ queryKey: keys.instruments })
      },
    }),
    deleteSection: useMutation({
      mutationFn: (id: number) => api.deleteSection(id, ensureSecret()),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: keys.sections })
        void queryClient.invalidateQueries({ queryKey: keys.instruments })
      },
    }),
  }
}

export const usePresenceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: number
      payload: Parameters<typeof api.submitPresence>[1]
    }) => api.submitPresence(eventId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: keys.events })
      void queryClient.invalidateQueries({ queryKey: keys.statuses })
      return queryClient.invalidateQueries({
        queryKey: [...keys.events, variables.eventId],
      })
    },
  })
}

