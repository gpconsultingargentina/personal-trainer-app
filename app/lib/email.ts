import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend) {
    console.warn('RESEND_API_KEY no está configurada. Email no enviado:', { to, subject })
    return
  }

  if (!process.env.EMAIL_FROM) {
    console.warn('EMAIL_FROM no está configurada. Email no enviado:', { to, subject })
    return
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Error enviando email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(
  to: string,
  studentName: string,
  trainerName: string = 'Gaston Otakufiit'
): Promise<void> {
  const subject = `¡Bienvenido/a, ${studentName}!`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">¡Bienvenido/a!</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hola <strong>${studentName}</strong>,
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Gracias por elegirme. Soy <strong>${trainerName}</strong> y voy a ayudarte a cambiar tu cuerpo y mente para una vida mejor de la manera más divertida.
          </p>
          <p style="font-size: 16px; margin-bottom: 0;">
            Estoy emocionado/a de comenzar este viaje contigo.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>Personal Trainer App</p>
        </div>
      </body>
    </html>
  `

  await sendEmail(to, subject, html)
}

