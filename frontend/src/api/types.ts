export type Instrument = {
  id: number;
  name: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Musician = {
  id: number;
  firstName: string;
  lastName: string;
  color?: string | null;
  email?: string | null;
  phone?: string | null;
  instrumentId: number;
  instrument: Instrument;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceStatus = {
  id: number;
  label: string;
  color?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventMusician = {
  id: number;
  musicianId: number;
  musician: Musician;
  eventId: number;
  isRequired: boolean;
  notes?: string | null;
};

export type Presence = {
  id: number;
  eventId: number;
  musicianId: number;
  statusId: number;
  comment?: string | null;
  respondedAt: string;
  musician: Musician;
  status: AttendanceStatus;
};

export type Event = {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  price?: string | null;
  organizer?: string | null;
  assignments: EventMusician[];
  presences: Presence[];
  createdAt: string;
  updatedAt: string;
};

