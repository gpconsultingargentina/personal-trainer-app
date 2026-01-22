/**
 * Script de prueba para SMS y WhatsApp
 * 
 * Uso:
 *   npx tsx scripts/test-sms-whatsapp.ts
 * 
 * O si tienes tsx instalado globalmente:
 *   tsx scripts/test-sms-whatsapp.ts
 */

import { sendReminderSMS, sendReminderWhatsApp } from '../app/lib/notifications/sms'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function testSMS() {
  console.log('\n📱 Probando envío de SMS...\n')
  
  // ⚠️ IMPORTANTE: Reemplaza este número con tu número de teléfono verificado en Twilio
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+541123903397'
  
  console.log(`Enviando SMS a: ${testPhoneNumber}`)
  
  const result = await sendReminderSMS({
    to: testPhoneNumber,
    studentName: 'Test Usuario',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas desde ahora
    reminderType: '2h',
  })

  if (result.success) {
    console.log('✅ SMS enviado exitosamente!')
  } else {
    console.error('❌ Error al enviar SMS:', result.error)
  }
  
  return result
}

async function testWhatsApp() {
  console.log('\n💬 Probando envío de WhatsApp...\n')
  
  // ⚠️ IMPORTANTE: Reemplaza este número con tu número de WhatsApp verificado en el sandbox de Twilio
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+541123903397'
  
  console.log(`Enviando WhatsApp a: ${testPhoneNumber}`)
  console.log('⚠️  Nota: Este número debe estar unido al sandbox de WhatsApp de Twilio')
  
  const result = await sendReminderWhatsApp({
    to: testPhoneNumber,
    studentName: 'Test Usuario',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas desde ahora
    reminderType: '2h',
  })

  if (result.success) {
    console.log('✅ WhatsApp enviado exitosamente!')
  } else {
    console.error('❌ Error al enviar WhatsApp:', result.error)
  }
  
  return result
}

async function main() {
  console.log('🚀 Iniciando pruebas de SMS y WhatsApp...\n')
  console.log('=' .repeat(50))
  
  // Verificar variables de entorno
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.error('❌ Error: TWILIO_ACCOUNT_SID no está configurado en .env.local')
    process.exit(1)
  }
  
  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Error: TWILIO_AUTH_TOKEN no está configurado en .env.local')
    process.exit(1)
  }
  
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ Error: TWILIO_PHONE_NUMBER no está configurado en .env.local')
    process.exit(1)
  }
  
  if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    console.error('❌ Error: TWILIO_WHATSAPP_NUMBER no está configurado en .env.local')
    process.exit(1)
  }
  
  console.log('✅ Variables de entorno verificadas\n')
  
  // Preguntar qué probar
  const args = process.argv.slice(2)
  const testType = args[0] || 'both' // 'sms', 'whatsapp', o 'both'
  
  try {
    if (testType === 'sms' || testType === 'both') {
      await testSMS()
    }
    
    if (testType === 'whatsapp' || testType === 'both') {
      await testWhatsApp()
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✨ Pruebas completadas!\n')
  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error)
    process.exit(1)
  }
}

main()
