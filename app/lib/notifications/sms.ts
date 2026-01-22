import twilio from 'twilio'
import { formatDateTime24h } from '@/app/lib/utils'

/**
 * Tipos auxiliares para formatear mejor los errores de Twilio.
 */
type TwilioApiError = Error & {
  status?: number
  code?: number | string
  moreInfo?: string
}

/**
 * Formatea un error de Twilio para que el usuario vea detalles útiles.
 */
function formatTwilioError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as TwilioApiError
    const parts = [
      err.message || 'Error en Twilio',
      err.code ? ` (code ${err.code}${err.status ? `, status ${err.status}` : ''})` : '',
      err.moreInfo ? ` - ${err.moreInfo}` : '',
    ]
    return parts.join('')
  }

  return error instanceof Error ? error.message : 'Error desconocido'
}

/**
 * Asegura que un número esté en formato E.164 (+123...).
 * Lanza si está vacío o no cumple el formato.
 */
function ensureE164(phone: string, label: string): string {
  const trimmed = (phone || '').trim()
  if (!trimmed) {
    throw new Error(`${label} no puede estar vacío`)
  }

  const withPlus = trimmed.startsWith('+') ? trimmed : `+${trimmed}`
  if (!/^\+\d{6,15}$/.test(withPlus)) {
    throw new Error(`${label} debe estar en formato E.164, ej: +541123456789`)
  }

  return withPlus
}

/**
 * Obtiene el cliente de Twilio, inicializándolo solo cuando se necesita
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN deben estar configurados en .env.local')
  }

  if (!accountSid.startsWith('AC')) {
    throw new Error(
      `TWILIO_ACCOUNT_SID debe empezar con "AC". Valor actual: ${
        accountSid ? accountSid.substring(0, 10) + '...' : 'undefined'
      }`,
    )
  }

  return twilio(accountSid, authToken)
}

interface SendReminderSMSParams {
  to: string
  studentName: string
  scheduledAt: string
  reminderType: '24h' | '2h'
}

interface SendReminderWhatsAppParams {
  to: string
  studentName: string
  scheduledAt: string
  reminderType: '24h' | '2h'
}

/**
 * Normaliza el número de teléfono para SMS (asegura formato E.164)
 */
function normalizePhoneNumber(phone: string, label: string): string {
  // Si llega con prefijo whatsapp:, removerlo para SMS
  const cleanPhone = phone.replace(/^whatsapp:/, '')
  return ensureE164(cleanPhone, label)
}

/**
 * Normaliza el número de teléfono para WhatsApp (formato whatsapp:+1234567890)
 */
function normalizeWhatsAppNumber(phone: string, label: string): string {
  // Remover formato whatsapp: si ya existe (evita whatsapp:whatsapp:+...)
  const cleanPhone = phone.replace(/^whatsapp:/, '')
  const normalized = ensureE164(cleanPhone, label)
  return `whatsapp:${normalized}`
}

export async function sendReminderSMS({
  to,
  studentName,
  scheduledAt,
  reminderType,
}: SendReminderSMSParams): Promise<{ success: boolean; error?: string }> {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    console.error('Configuración de Twilio no encontrada')
    return { success: false, error: 'Configuración de SMS no encontrada' }
  }

  try {
    const twilioClient = getTwilioClient()
    const formattedDate = formatDateTime24h(scheduledAt)
    const timeUntil = reminderType === '24h' ? '24 horas' : '2 horas'
    
    const message = `Hola ${studentName}, recordatorio: Tu clase es el ${formattedDate} (en ${timeUntil}). ¡Te esperamos!`

    const normalizedTo = normalizePhoneNumber(to, 'Número de destino SMS')
    const normalizedFrom = normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER, 'TWILIO_PHONE_NUMBER')

    const result = await twilioClient.messages.create({
      body: message,
      from: normalizedFrom,
      to: normalizedTo,
    })

    if (result.errorCode || result.errorMessage) {
      console.error('Error al enviar SMS:', result.errorMessage)
      return {
        success: false,
        error: result.errorMessage || 'Error desconocido',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error inesperado al enviar SMS:', error)
    return {
      success: false,
      error: formatTwilioError(error),
    }
  }
}

export async function sendReminderWhatsApp({
  to,
  studentName,
  scheduledAt,
  reminderType,
}: SendReminderWhatsAppParams): Promise<{ success: boolean; error?: string }> {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    console.error('Configuración de Twilio WhatsApp no encontrada')
    return { success: false, error: 'Configuración de WhatsApp no encontrada' }
  }

  try {
    const twilioClient = getTwilioClient()
    const formattedDate = formatDateTime24h(scheduledAt)
    const timeUntil = reminderType === '24h' ? '24 horas' : '2 horas'
    
    const message = `Hola ${studentName}, recordatorio: Tu clase es el ${formattedDate} (en ${timeUntil}). ¡Te esperamos!`

    const normalizedTo = normalizeWhatsAppNumber(to, 'Número de destino WhatsApp')
    const normalizedFrom = normalizeWhatsAppNumber(process.env.TWILIO_WHATSAPP_NUMBER, 'TWILIO_WHATSAPP_NUMBER')

    const result = await twilioClient.messages.create({
      body: message,
      from: normalizedFrom,
      to: normalizedTo,
    })

    if (result.errorCode || result.errorMessage) {
      console.error('Error al enviar WhatsApp:', result.errorMessage)
      return {
        success: false,
        error: result.errorMessage || 'Error desconocido',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error inesperado al enviar WhatsApp:', error)
    return {
      success: false,
      error: formatTwilioError(error),
    }
  }
}
