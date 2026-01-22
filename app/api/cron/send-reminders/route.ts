import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'
import { sendReminderEmail } from '@/app/lib/notifications/email'
import { sendReminderSMS, sendReminderWhatsApp } from '@/app/lib/notifications/sms'

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
        classes!inner(scheduled_at, duration_minutes),
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
        classes!inner(scheduled_at, duration_minutes),
        students!inner(email, phone, name)
      `)
      .eq('status', 'confirmed')
      .eq('reminder_2h_sent', false)
      .gte('classes.scheduled_at', in2Hours.toISOString())
      .lte('classes.scheduled_at', in2HoursPlus1Min.toISOString())

    const results = {
      emails24h: { sent: 0, failed: 0 },
      sms24h: { sent: 0, failed: 0 },
      whatsapp24h: { sent: 0, failed: 0 },
      emails2h: { sent: 0, failed: 0 },
      sms2h: { sent: 0, failed: 0 },
      whatsapp2h: { sent: 0, failed: 0 },
    }

    // Procesar recordatorios de 24h
    for (const booking of bookings24h || []) {
      const student = booking.students
      const classData = booking.classes
      
      if (!student || !classData) continue

      let emailSent = false
      let smsSent = false
      let whatsappSent = false

      // Enviar email
      if (student.email) {
        const emailResult = await sendReminderEmail({
          to: student.email,
          studentName: student.name,
          className: `Clase de ${classData.duration_minutes} minutos`,
          scheduledAt: classData.scheduled_at,
          reminderType: '24h',
        })

        if (emailResult.success) {
          emailSent = true
          results.emails24h.sent++
        } else {
          results.emails24h.failed++
          console.error(`Error al enviar email a ${student.email}:`, emailResult.error)
        }
      }

      // Enviar SMS
      if (student.phone) {
        const smsResult = await sendReminderSMS({
          to: student.phone,
          studentName: student.name,
          scheduledAt: classData.scheduled_at,
          reminderType: '24h',
        })

        if (smsResult.success) {
          smsSent = true
          results.sms24h.sent++
        } else {
          results.sms24h.failed++
          console.error(`Error al enviar SMS a ${student.phone}:`, smsResult.error)
        }
      }

      // Enviar WhatsApp
      if (student.phone) {
        const whatsappResult = await sendReminderWhatsApp({
          to: student.phone,
          studentName: student.name,
          scheduledAt: classData.scheduled_at,
          reminderType: '24h',
        })

        if (whatsappResult.success) {
          whatsappSent = true
          results.whatsapp24h.sent++
        } else {
          results.whatsapp24h.failed++
          console.error(`Error al enviar WhatsApp a ${student.phone}:`, whatsappResult.error)
        }
      }

      // Solo marcar como enviado si al menos uno (email, SMS o WhatsApp) fue exitoso
      if (emailSent || smsSent || whatsappSent) {
        await supabase
          .from('bookings')
          .update({ reminder_24h_sent: true })
          .eq('id', booking.id)

        // Registrar en log
        if (emailSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'email_24h',
            status: 'sent',
          })
        }
        if (smsSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'sms_24h',
            status: 'sent',
          })
        }
        if (whatsappSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'sms_24h', // Usamos el mismo tipo para WhatsApp en el log
            status: 'sent',
          })
        }
      }
    }

    // Procesar recordatorios de 2h
    for (const booking of bookings2h || []) {
      const student = booking.students
      const classData = booking.classes
      
      if (!student || !classData) continue

      let emailSent = false
      let smsSent = false
      let whatsappSent = false

      // Enviar email
      if (student.email) {
        const emailResult = await sendReminderEmail({
          to: student.email,
          studentName: student.name,
          className: `Clase de ${classData.duration_minutes} minutos`,
          scheduledAt: classData.scheduled_at,
          reminderType: '2h',
        })

        if (emailResult.success) {
          emailSent = true
          results.emails2h.sent++
        } else {
          results.emails2h.failed++
          console.error(`Error al enviar email a ${student.email}:`, emailResult.error)
        }
      }

      // Enviar SMS
      if (student.phone) {
        const smsResult = await sendReminderSMS({
          to: student.phone,
          studentName: student.name,
          scheduledAt: classData.scheduled_at,
          reminderType: '2h',
        })

        if (smsResult.success) {
          smsSent = true
          results.sms2h.sent++
        } else {
          results.sms2h.failed++
          console.error(`Error al enviar SMS a ${student.phone}:`, smsResult.error)
        }
      }

      // Enviar WhatsApp
      if (student.phone) {
        const whatsappResult = await sendReminderWhatsApp({
          to: student.phone,
          studentName: student.name,
          scheduledAt: classData.scheduled_at,
          reminderType: '2h',
        })

        if (whatsappResult.success) {
          whatsappSent = true
          results.whatsapp2h.sent++
        } else {
          results.whatsapp2h.failed++
          console.error(`Error al enviar WhatsApp a ${student.phone}:`, whatsappResult.error)
        }
      }

      // Solo marcar como enviado si al menos uno (email, SMS o WhatsApp) fue exitoso
      if (emailSent || smsSent || whatsappSent) {
        await supabase
          .from('bookings')
          .update({ reminder_2h_sent: true })
          .eq('id', booking.id)

        // Registrar en log
        if (emailSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'email_2h',
            status: 'sent',
          })
        }
        if (smsSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'sms_2h',
            status: 'sent',
          })
        }
        if (whatsappSent) {
          await supabase.from('notifications_log').insert({
            booking_id: booking.id,
            notification_type: 'sms_2h', // Usamos el mismo tipo para WhatsApp en el log
            status: 'sent',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      '24h': {
        emails: results.emails24h,
        sms: results.sms24h,
        whatsapp: results.whatsapp24h,
        total: bookings24h?.length || 0,
      },
      '2h': {
        emails: results.emails2h,
        sms: results.sms2h,
        whatsapp: results.whatsapp2h,
        total: bookings2h?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Error processing reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

