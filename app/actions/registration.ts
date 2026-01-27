'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { randomBytes } from 'crypto'

export type RegistrationToken = {
  id: string
  student_id: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export type RegistrationTokenWithStudent = RegistrationToken & {
  student: {
    id: string
    name: string
    email: string
  }
}

/**
 * Crea un token de registro para un alumno
 * Solo el trainer puede crear tokens
 */
export async function createRegistrationToken(
  studentId: string
): Promise<{ token: string; expiresAt: string; link: string }> {
  const supabase = await createClient()

  // Verificar que el estudiante existe
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, email, auth_user_id')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    throw new Error('Estudiante no encontrado')
  }

  // Verificar que el estudiante no está ya registrado
  if (student.auth_user_id) {
    throw new Error('Este alumno ya tiene una cuenta registrada')
  }

  // Invalidar tokens anteriores del mismo estudiante
  await supabase
    .from('registration_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .is('used_at', null)

  // Generar token único
  const token = randomBytes(32).toString('hex')

  // Expira en 7 días
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Crear token
  const { error: insertError } = await supabase
    .from('registration_tokens')
    .insert({
      student_id: studentId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    throw new Error(`Error al crear token: ${insertError.message}`)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const link = `${appUrl}/registro?token=${token}`

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    link,
  }
}

/**
 * Valida un token de registro
 * Devuelve los datos del estudiante si el token es válido
 */
export async function validateRegistrationToken(
  token: string
): Promise<{ valid: boolean; student?: { id: string; name: string; email: string } }> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('registration_tokens')
    .select(`
      id,
      student_id,
      token,
      expires_at,
      used_at,
      students(id, name, email, auth_user_id)
    `)
    .eq('token', token)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Verificar que no esté usado
  if (data.used_at) {
    return { valid: false }
  }

  // Verificar que no haya expirado
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  // Verificar que el estudiante no esté ya registrado
  // Supabase puede devolver un objeto o array
  const studentData = Array.isArray(data.students) ? data.students[0] : data.students
  const student = studentData as { id: string; name: string; email: string; auth_user_id: string | null }

  if (!student) {
    return { valid: false }
  }

  if (student.auth_user_id) {
    return { valid: false }
  }

  return {
    valid: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
  }
}

/**
 * Marca un token como usado
 */
export async function invalidateToken(token: string): Promise<void> {
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('registration_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  if (error) {
    throw new Error(`Error al invalidar token: ${error.message}`)
  }
}

/**
 * Obtiene tokens pendientes de un estudiante (para debug/admin)
 */
export async function getPendingTokens(studentId: string): Promise<RegistrationToken[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registration_tokens')
    .select('*')
    .eq('student_id', studentId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
