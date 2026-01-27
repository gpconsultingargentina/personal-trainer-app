'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateRegistrationToken, invalidateToken } from './registration'

export type UserRole = 'trainer' | 'student' | null

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const role = user.user_metadata?.role as UserRole
  return role || null
}

/**
 * Obtiene el usuario actual con su rol
 */
export async function getCurrentUser(): Promise<{
  id: string
  email: string
  role: UserRole
} | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role as UserRole || null,
  }
}

/**
 * Registra un nuevo alumno usando un token de invitación
 */
export async function registerStudent(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Validar el token
  const validation = await validateRegistrationToken(token)

  if (!validation.valid || !validation.student) {
    return { success: false, error: 'Token inválido o expirado' }
  }

  const { student } = validation
  const supabase = await createServiceClient()

  // Crear usuario en auth.users con rol 'student'
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email: student.email,
    password,
    email_confirm: true, // Confirmar email automáticamente
    user_metadata: {
      role: 'student',
      name: student.name,
    },
  })

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  if (!authData.user) {
    return { success: false, error: 'Error al crear usuario' }
  }

  // Vincular con el registro de student
  const { error: linkError } = await supabase
    .from('students')
    .update({ auth_user_id: authData.user.id })
    .eq('id', student.id)

  if (linkError) {
    // Intentar limpiar el usuario creado
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: 'Error al vincular cuenta' }
  }

  // Invalidar el token
  await invalidateToken(token)

  return { success: true }
}

/**
 * Vincula un auth.user existente con un student
 * (Para casos especiales/migración)
 */
export async function linkStudentToAuth(
  studentId: string,
  authUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceClient()

  // Verificar que el estudiante existe
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, auth_user_id')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return { success: false, error: 'Estudiante no encontrado' }
  }

  if (student.auth_user_id) {
    return { success: false, error: 'El estudiante ya tiene una cuenta vinculada' }
  }

  // Verificar que el auth user existe
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(authUserId)

  if (authError || !authUser.user) {
    return { success: false, error: 'Usuario de auth no encontrado' }
  }

  // Vincular
  const { error: updateError } = await supabase
    .from('students')
    .update({ auth_user_id: authUserId })
    .eq('id', studentId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

