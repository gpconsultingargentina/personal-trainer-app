import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { getStudentByAuthUserId } from '@/app/actions/students'
import { getStudentBookings } from '@/app/actions/bookings'
import { generateICalendar, bookingsToCalendarEvents } from '@/app/lib/ical/generator'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const student = await getStudentByAuthUserId(user.id)

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Obtener clases futuras confirmadas
    const bookings = await getStudentBookings(student.id, {
      status: 'confirmed',
      upcoming: true,
      limit: 100,
    })

    const events = bookingsToCalendarEvents(bookings, student.name)
    const icsContent = await generateICalendar(events, `Clases de ${student.name}`)

    // Devolver como archivo descargable
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="mis-clases.ics"`,
      },
    })
  } catch (error) {
    console.error('Error generando calendario:', error)
    return NextResponse.json(
      { error: 'Error al generar el calendario' },
      { status: 500 }
    )
  }
}
