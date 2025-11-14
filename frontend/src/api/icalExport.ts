import type { Event } from './types'

/**
 * Formate une date au format iCal (YYYYMMDDTHHMMSS)
 */
const formatICalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}`
}

/**
 * Échappe les caractères spéciaux pour iCal
 */
const escapeICalText = (text: string): string => {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Génère un fichier iCal à partir d'une liste d'événements
 */
export const generateICalFile = (events: Event[]): string => {
  const now = new Date()
  const timestamp = formatICalDate(now)

  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Fanfare//Agenda des Concerts//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Open Fanfare - Concerts',
    'X-WR-TIMEZONE:Europe/Paris',
    'X-WR-CALDESC:Calendrier des concerts de la fanfare',
  ].join('\r\n')

  events.forEach((event) => {
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2h par défaut

    // Construire la description
    let description = ''
    if (event.description) {
      description += escapeICalText(event.description) + '\\n\\n'
    }
    if (event.organizer) {
      description += `Organisateur: ${escapeICalText(event.organizer)}\\n`
    }
    if (event.price) {
      description += `Tarif: ${escapeICalText(event.price)}\\n`
    }
    description += `\\nMusiciens attendus: ${event.assignments.length}`

    const eventLines = [
      '',
      'BEGIN:VEVENT',
      `UID:${event.id}@openfanfare.local`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${escapeICalText(event.title)}`,
      description ? `DESCRIPTION:${description}` : '',
      event.location ? `LOCATION:${escapeICalText(event.location)}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n')

    ical += eventLines
  })

  ical += '\r\nEND:VCALENDAR'

  return ical
}

/**
 * Télécharge le fichier iCal
 */
export const downloadICalFile = (events: Event[], filename = 'concerts-fanfare.ics'): void => {
  const icalContent = generateICalFile(events)
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
