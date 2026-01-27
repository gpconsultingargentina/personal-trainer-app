import { NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'
import { generateICalendar, bookingsToCalendarEvents } from '@/app/lib/ical/generator'

type RouteParams = {
  params: Promise<{
    token: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Buscar estudiante por token
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, calendar_token')
      .eq('calendar_token', token)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 404 })
    }

    // Obtener clases futuras confirmadas
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        classes(id, scheduled_at, duration_minutes)
      `)
      .eq('student_id', student.id)
      .eq('status', 'confirmed')
      .gte('classes.scheduled_at', new Date().toISOString())
      .order('classes.scheduled_at', { ascending: true })
      .limit(100)

    if (bookingsError) {
      console.error('Error obteniendo bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Error al obtener clases' },
        { status: 500 }
      )
    }

    // Transformar datos para el generador
    const transformedBookings = (bookings || [])
      .filter((b) => b.classes)
      .map((b) => {
        const classData = (Array.isArray(b.classes) ? b.classes[0] : b.classes) as {
          id: string
          scheduled_at: string
          duration_minutes: number
        }
        return {
          id: b.id,
          status: b.status,
          class: classData,
        }
      })
      .filter((b) => b.class)

    const events = bookingsToCalendarEvents(transformedBookings, student.name)
    const icsContent = await generateICalendar(events, `Clases de ${student.name}`)

    // Devolver para suscripción (no como attachment, para que webcal:// funcione)
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
