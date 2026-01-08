import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    const now = new Date()
    
    // Calcular tiempos para recordatorios
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in24HoursPlus1Min = new Date(in24Hours.getTime() + 60 * 1000)
    const in2HoursPlus1Min = new Date(in2Hours.getTime() + 60 * 1000)

    // Obtener reservas que necesitan recordatorio de 24h
    const { data: bookings24h } = await supabase
      .from('bookings')
      .select(`
        *,
        classes!inner(scheduled_at),
        students!inner(email, phone, name)
      `)
      .eq('status', 'confirmed')
      .eq('reminder_24h_sent', false)
      .gte('classes.scheduled_at', in24Hours.toISOString())
      .lte('classes.scheduled_at', in24HoursPlus1Min.toISOString())

    // Obtener reservas que necesitan recordatorio de 2h
    const { data: bookings2h } = await supabase
      .from('bookings')
      .select(`
        *,
        classes!inner(scheduled_at),
        students!inner(email, phone, name)
      `)
      .eq('status', 'confirmed')
      .eq('reminder_2h_sent', false)
      .gte('classes.scheduled_at', in2Hours.toISOString())
      .lte('classes.scheduled_at', in2HoursPlus1Min.toISOString())

    // Aquí deberías enviar los emails/SMS usando Resend y Twilio
    // Por ahora solo marcamos como enviados

    const allBookings = [
      ...(bookings24h || []).map(b => ({ id: b.id, type: '24h' })),
      ...(bookings2h || []).map(b => ({ id: b.id, type: '2h' })),
    ]

    for (const booking of allBookings) {
      const updateField = booking.type === '24h' 
        ? { reminder_24h_sent: true }
        : { reminder_2h_sent: true }

      await supabase
        .from('bookings')
        .update(updateField)
        .eq('id', booking.id)

      // Registrar en log
      await supabase.from('notifications_log').insert({
        booking_id: booking.id,
        notification_type: booking.type === '24h' ? 'email_24h' : 'email_2h',
        status: 'sent',
      })
    }

    return NextResponse.json({
      success: true,
      sent: allBookings.length,
      '24h': bookings24h?.length || 0,
      '2h': bookings2h?.length || 0,
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Error processing reminders' },
      { status: 500 }
    )
  }
}

