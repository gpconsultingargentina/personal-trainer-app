'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreditBalance = {
  id: string
  student_id: string
  payment_proof_id: string | null
  classes_purchased: number
  classes_remaining: number
  price_per_class: number
  frequency_code: string
  purchased_at: string
  expires_at: string
  status: 'active' | 'depleted' | 'expired'
  created_at: string
  updated_at: string
}

export type CreditTransaction = {
  id: string
  credit_balance_id: string
  student_id: string
  booking_id: string | null
  transaction_type: 'purchase' | 'attendance' | 'adjustment' | 'expiration' | 'late_cancellation'
  amount: number
  balance_after: number
  notes: string | null
  created_at: string
}

export type StudentCreditSummary = {
  available: number
  expiringSoon: number // Créditos que vencen en los próximos 7 días
  nextExpirationDate: string | null
  totalPurchased: number
  totalUsed: number
}

export async function getStudentCredits(studentId: string): Promise<{
  total: number
  details: CreditBalance[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('expires_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const details = data || []
  const total = details.reduce((sum, cb) => sum + cb.classes_remaining, 0)

  return { total, details }
}

export async function getStudentCreditSummary(
  studentId: string
): Promise<StudentCreditSummary> {
  const supabase = await createClient()

  // Obtener balances activos
  const { data: activeBalances, error: activeError } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('expires_at', { ascending: true })

  if (activeError) {
    throw new Error(activeError.message)
  }

  // Obtener todos los balances para estadísticas
  const { data: allBalances, error: allError } = await supabase
    .from('credit_balances')
    .select('classes_purchased, classes_remaining, status')
    .eq('student_id', studentId)

  if (allError) {
    throw new Error(allError.message)
  }

  const balances = activeBalances || []
  const all = allBalances || []

  // Calcular créditos disponibles
  const available = balances.reduce((sum, cb) => sum + cb.classes_remaining, 0)

  // Calcular créditos que vencen en 7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const expiringSoon = balances
    .filter((cb) => new Date(cb.expires_at) <= sevenDaysFromNow)
    .reduce((sum, cb) => sum + cb.classes_remaining, 0)

  // Próxima fecha de vencimiento
  const nextExpirationDate =
    balances.length > 0 ? balances[0].expires_at : null

  // Estadísticas totales
  const totalPurchased = all.reduce((sum, cb) => sum + cb.classes_purchased, 0)
  const totalUsed = all.reduce(
    (sum, cb) => sum + (cb.classes_purchased - cb.classes_remaining),
    0
  )

  return {
    available,
    expiringSoon,
    nextExpirationDate,
    totalPurchased,
    totalUsed,
  }
}

export async function createCreditBalance(data: {
  studentId: string
  paymentProofId: string
  classesPurchased: number
  pricePerClass: number
  frequencyCode: string
}): Promise<CreditBalance> {
  const supabase = await createServiceClient()

  // Calcular fecha de expiración (60 días)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 60)

  const { data: balance, error } = await supabase
    .from('credit_balances')
    .insert({
      student_id: data.studentId,
      payment_proof_id: data.paymentProofId,
      classes_purchased: data.classesPurchased,
      classes_remaining: data.classesPurchased,
      price_per_class: data.pricePerClass,
      frequency_code: data.frequencyCode,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear balance de créditos: ${error.message}`)
  }

  // Crear transacción de compra
  await supabase.from('credit_transactions').insert({
    credit_balance_id: balance.id,
    student_id: data.studentId,
    transaction_type: 'purchase',
    amount: data.classesPurchased,
    balance_after: data.classesPurchased,
    notes: `Compra de ${data.classesPurchased} clases a $${data.pricePerClass} c/u`,
  })

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/payments')
  return balance
}

export async function deductCredit(
  studentId: string,
  bookingId: string
): Promise<{ success: boolean; remainingCredits: number }> {
  const supabase = await createServiceClient()

  // Obtener el balance activo más antiguo (FIFO)
  const { data: balances, error: fetchError } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gt('classes_remaining', 0)
    .order('expires_at', { ascending: true })
    .limit(1)

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!balances || balances.length === 0) {
    throw new Error('El alumno no tiene créditos disponibles')
  }

  const balance = balances[0]
  const newRemaining = balance.classes_remaining - 1
  const newStatus = newRemaining === 0 ? 'depleted' : 'active'

  // Actualizar balance
  const { error: updateError } = await supabase
    .from('credit_balances')
    .update({
      classes_remaining: newRemaining,
      status: newStatus,
    })
    .eq('id', balance.id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Crear transacción de asistencia
  await supabase.from('credit_transactions').insert({
    credit_balance_id: balance.id,
    student_id: studentId,
    booking_id: bookingId,
    transaction_type: 'attendance',
    amount: -1,
    balance_after: newRemaining,
    notes: 'Asistencia a clase',
  })

  // Calcular total restante
  const { data: remainingBalances } = await supabase
    .from('credit_balances')
    .select('classes_remaining')
    .eq('student_id', studentId)
    .eq('status', 'active')

  const totalRemaining =
    remainingBalances?.reduce((sum, cb) => sum + cb.classes_remaining, 0) || 0

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')
  return { success: true, remainingCredits: totalRemaining }
}

export async function adjustCredits(
  studentId: string,
  amount: number,
  notes: string
): Promise<{ success: boolean }> {
  const supabase = await createServiceClient()

  if (amount === 0) {
    throw new Error('El ajuste no puede ser 0')
  }

  if (amount > 0) {
    // Agregar créditos: crear nuevo balance
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    const { data: balance, error } = await supabase
      .from('credit_balances')
      .insert({
        student_id: studentId,
        classes_purchased: amount,
        classes_remaining: amount,
        price_per_class: 0, // Ajuste manual, sin precio
        frequency_code: 'adjustment',
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    await supabase.from('credit_transactions').insert({
      credit_balance_id: balance.id,
      student_id: studentId,
      transaction_type: 'adjustment',
      amount: amount,
      balance_after: amount,
      notes: notes || `Ajuste manual: +${amount} clases`,
    })
  } else {
    // Quitar créditos: descontar de balances existentes (FIFO)
    let remaining = Math.abs(amount)

    const { data: balances, error: fetchError } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .gt('classes_remaining', 0)
      .order('expires_at', { ascending: true })

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!balances || balances.length === 0) {
      throw new Error('No hay créditos para ajustar')
    }

    const totalAvailable = balances.reduce(
      (sum, b) => sum + b.classes_remaining,
      0
    )
    if (totalAvailable < remaining) {
      throw new Error(
        `Solo hay ${totalAvailable} créditos disponibles para ajustar`
      )
    }

    for (const balance of balances) {
      if (remaining <= 0) break

      const toDeduct = Math.min(remaining, balance.classes_remaining)
      const newRemaining = balance.classes_remaining - toDeduct
      const newStatus = newRemaining === 0 ? 'depleted' : 'active'

      await supabase
        .from('credit_balances')
        .update({
          classes_remaining: newRemaining,
          status: newStatus,
        })
        .eq('id', balance.id)

      await supabase.from('credit_transactions').insert({
        credit_balance_id: balance.id,
        student_id: studentId,
        transaction_type: 'adjustment',
        amount: -toDeduct,
        balance_after: newRemaining,
        notes: notes || `Ajuste manual: -${toDeduct} clases`,
      })

      remaining -= toDeduct
    }
  }

  revalidatePath('/dashboard/students')
  return { success: true }
}

export async function getCreditTransactions(
  studentId: string,
  limit: number = 20
): Promise<CreditTransaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function expireCredits(): Promise<{ expiredCount: number }> {
  const supabase = await createServiceClient()

  // Buscar balances expirados
  const { data: expiredBalances, error: fetchError } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (!expiredBalances || expiredBalances.length === 0) {
    return { expiredCount: 0 }
  }

  let totalExpired = 0

  for (const balance of expiredBalances) {
    // Marcar como expirado
    await supabase
      .from('credit_balances')
      .update({ status: 'expired' })
      .eq('id', balance.id)

    // Crear transacción de expiración
    if (balance.classes_remaining > 0) {
      await supabase.from('credit_transactions').insert({
        credit_balance_id: balance.id,
        student_id: balance.student_id,
        transaction_type: 'expiration',
        amount: -balance.classes_remaining,
        balance_after: 0,
        notes: `Expiración automática de ${balance.classes_remaining} créditos`,
      })

      totalExpired += balance.classes_remaining
    }
  }

  return { expiredCount: totalExpired }
}
