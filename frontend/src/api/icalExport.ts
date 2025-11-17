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

    // Filtrer les musiciens ayant répondu positivement
    const presentMusicians = event.presences
      .filter((presence) => presence.status.label.toLowerCase().includes('présent'))
      .map((presence) => ({
        name: `${presence.musician.firstName} ${presence.musician.lastName}`,
        instrument: presence.musician.instrument.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Construire la description
    let description = ''
    if (event.description) {
      description += escapeICalText(event.description) + '\\n\\n'
    }
    
    if (event.setlist) {
      description += 'SETLIST:\\n'
      const songs = event.setlist.split('\n').filter(s => s.trim())
      songs.forEach((song, index) => {
        description += `${index + 1}. ${escapeICalText(song.trim())}\\n`
      })
      description += '\\n'
    }
    
    if (event.organizer) {
      description += `Organisateur: ${escapeICalText(event.organizer)}\\n`
    }
    if (event.price) {
      description += `Tarif: ${escapeICalText(event.price)}\\n`
    }
    description += `\\nMusiciens attendus: ${event.assignments.length}`
    
    if (presentMusicians.length > 0) {
      description += `\\nMusiciens présents (${presentMusicians.length}):\\n`
      presentMusicians.forEach((musician) => {
        description += `  - ${escapeICalText(musician.name)} (${escapeICalText(musician.instrument)})\\n`
      })
    }

    ical += '\r\n'
    ical += 'BEGIN:VEVENT\r\n'
    ical += `UID:${event.id}@openfanfare.local\r\n`
    ical += `DTSTAMP:${timestamp}\r\n`
    ical += `DTSTART:${formatICalDate(startDate)}\r\n`
    ical += `DTEND:${formatICalDate(endDate)}\r\n`
    ical += `SUMMARY:${escapeICalText(event.title)}\r\n`
    if (description) {
      ical += `DESCRIPTION:${description}\r\n`
    }
    if (event.location) {
      ical += `LOCATION:${escapeICalText(event.location)}\r\n`
    }
    ical += 'STATUS:CONFIRMED\r\n'
    ical += 'SEQUENCE:0\r\n'
    ical += 'END:VEVENT'
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
