import { Resend } from 'resend'
import { formatDateTime24h } from '@/app/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendReminderEmailParams {
  to: string
  studentName: string
  className: string
  scheduledAt: string
  reminderType: '24h' | '2h'
}

export async function sendReminderEmail({
  to,
  studentName,
  className,
  scheduledAt,
  reminderType,
}: SendReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error('RESEND_API_KEY o EMAIL_FROM no están configurados')
    return { success: false, error: 'Configuración de email no encontrada' }
  }

  try {
    const formattedDate = formatDateTime24h(scheduledAt)
    const timeUntil = reminderType === '24h' ? '24 horas' : '2 horas'
    
    const subject = `Recordatorio: Tu clase es en ${timeUntil}`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Recordatorio de Clase</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Hola <strong>${studentName}</strong>,</p>
            <p>Te recordamos que tienes una clase programada:</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 0; font-size: 18px;"><strong>Fecha y Hora:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px;">${formattedDate}</p>
            </div>
            <p>La clase comenzará en <strong>${timeUntil}</strong>. ¡Te esperamos!</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Si necesitas cancelar o modificar tu clase, por favor contáctanos.
            </p>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
    })

    if (error) {
      console.error('Error al enviar email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error inesperado al enviar email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
