import { createEvents, EventAttributes, DateArray } from 'ics'

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: Date
  duration: number // en minutos
  location?: string
}

/**
 * Convierte una fecha a DateArray para ics
 */
function dateToArray(date: Date): DateArray {
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ics usa 1-12, Date usa 0-11
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ]
}

/**
 * Genera un string iCalendar (.ics) a partir de un array de eventos
 */
export async function generateICalendar(
  events: CalendarEvent[],
  calendarName: string = 'Mis Clases'
): Promise<string> {
  const icsEvents: EventAttributes[] = events.map((event) => ({
    uid: `${event.id}@otakufiit.com`,
    start: dateToArray(event.start),
    duration: { minutes: event.duration },
    title: event.title,
    description: event.description,
    location: event.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    productId: 'otakufiit/personal-trainer-app',
    calName: calendarName,
  }))

  return new Promise((resolve, reject) => {
    createEvents(icsEvents, (error, value) => {
      if (error) {
        reject(error)
      } else {
        resolve(value)
      }
    })
  })
}

/**
 * Genera eventos de calendario a partir de bookings con clases
 */
export function bookingsToCalendarEvents(
  bookings: Array<{
    id: string
    class: {
      id: string
      scheduled_at: string
      duration_minutes: number
    }
    status: string
  }>,
  studentName?: string
): CalendarEvent[] {
  return bookings
    .filter((b) => b.status === 'confirmed' && b.class)
    .map((booking) => ({
      id: booking.id,
      title: studentName ? `Clase - ${studentName}` : 'Clase de Entrenamiento',
      description: 'Clase de entrenamiento personal',
      start: new Date(booking.class.scheduled_at),
      duration: booking.class.duration_minutes,
    }))
}
