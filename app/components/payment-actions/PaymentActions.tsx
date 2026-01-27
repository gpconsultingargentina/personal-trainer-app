'use client'

import { useState } from 'react'
import { updatePaymentProofStatus } from '@/app/actions/payments'
import { useRouter } from 'next/navigation'

interface PaymentActionsProps {
  paymentId: string
  studentName: string
}

export default function PaymentActions({ paymentId, studentName }: PaymentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    if (!confirm(`¿Estás seguro de que quieres aprobar el comprobante de ${studentName}?`)) {
      return
    }

    setLoading('approve')
    try {
      await updatePaymentProofStatus(paymentId, 'approved')
      router.refresh()
    } catch (error) {
      alert('Error al aprobar el comprobante: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setLoading(null)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Motivo del rechazo (opcional):') || undefined
    
    if (!confirm(`¿Estás seguro de que quieres rechazar el comprobante de ${studentName}?`)) {
      return
    }

    setLoading('reject')
    try {
      await updatePaymentProofStatus(paymentId, 'rejected', reason)
      router.refresh()
    } catch (error) {
      alert('Error al rechazar el comprobante: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="px-4 py-3 bg-success text-white rounded hover:bg-success/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'approve' ? 'Aprobando...' : 'Aprobar'}
      </button>
      <button
        onClick={handleReject}
        disabled={loading !== null}
        className="px-4 py-3 bg-error text-white rounded hover:bg-error/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'reject' ? 'Rechazando...' : 'Rechazar'}
      </button>
    </div>
  )
}

