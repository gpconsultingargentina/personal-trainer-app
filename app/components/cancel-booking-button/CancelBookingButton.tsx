'use client'

import { useState, useTransition } from 'react'
import { cancelBookingWithPolicy, checkCancellationConsequences } from '@/app/actions/bookings'

type ToleranceInfo = {
  used: number
  remaining: number
  tolerance: number
}

type CancellationCheck = {
  canCancel: boolean
  isLate: boolean
  willDeductCredit: boolean
  hoursUntilClass: number
  toleranceInfo: ToleranceInfo | null
  message: string
}

type Props = {
  bookingId: string
  classDate: string
  studentName: string
  onCancelled?: () => void
}

export default function CancelBookingButton({ bookingId, classDate, studentName, onCancelled }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [checkResult, setCheckResult] = useState<CancellationCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = async () => {
    setChecking(true)
    setError(null)

    try {
      const result = await checkCancellationConsequences(bookingId)
      setCheckResult(result)
      setShowModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar')
    } finally {
      setChecking(false)
    }
  }

  const handleConfirmCancel = () => {
    startTransition(async () => {
      try {
        const result = await cancelBookingWithPolicy(bookingId)

        if (result.success) {
          setShowModal(false)
          onCancelled?.()
          
          // Abrir WhatsApp con mensaje pre-rellenado
          openWhatsAppToTrainer()
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cancelar')
      }
    })
  }

  const openWhatsAppToTrainer = () => {
    // Formatear fecha y hora
    const date = new Date(classDate)
    const formattedDate = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
    
    // Construir mensaje
    const mensaje = `Hola profe, soy ${studentName}. Quiero cancelar mi clase del ${formattedDate}.`
    
    // Número de WhatsApp del entrenador (desde variable de entorno)
    const trainerPhone = process.env.NEXT_PUBLIC_TRAINER_WHATSAPP || '5491112345678'
    
    // Construir URL de WhatsApp
    const whatsappUrl = `https://wa.me/${trainerPhone}?text=${encodeURIComponent(mensaje)}`
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={checking || isPending}
        className="text-sm text-error hover:text-error/80 disabled:opacity-50"
      >
        {checking ? 'Verificando...' : 'Cancelar'}
      </button>

      {error && !showModal && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}

      {/* Modal de confirmación */}
      {showModal && checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Cancelar clase
            </h3>

            {!checkResult.canCancel ? (
              <>
                <p className="text-muted mb-4">{checkResult.message}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-background text-foreground rounded hover:bg-surface-alt"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Información sobre la cancelación */}
                <div className="mb-4 space-y-3">
                  {checkResult.isLate ? (
                    <div className={`p-3 rounded ${
                      checkResult.willDeductCredit
                        ? 'bg-error/10 border border-error'
                        : 'bg-primary/10 border border-primary'
                    }`}>
                      <p className={`text-sm ${
                        checkResult.willDeductCredit ? 'text-error' : 'text-primary'
                      }`}>
                        {checkResult.willDeductCredit ? '⚠️' : '⏰'} {checkResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-success/10 border border-success">
                      <p className="text-sm text-success">
                        ✓ {checkResult.message}
                      </p>
                    </div>
                  )}

                  {checkResult.toleranceInfo && (
                    <div className="p-3 rounded bg-background border border-border">
                      <p className="text-sm text-muted">
                        <strong>Tu tolerancia mensual:</strong>
                      </p>
                      <p className="text-sm text-muted mt-1">
                        {checkResult.toleranceInfo.used} de {checkResult.toleranceInfo.tolerance} cancelaciones tardías usadas este mes
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-muted">
                    Tiempo hasta la clase: {Math.floor(checkResult.hoursUntilClass)}h {Math.round((checkResult.hoursUntilClass % 1) * 60)}min
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-error mb-4">{error}</p>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isPending}
                    className="px-4 py-2 bg-background text-foreground rounded hover:bg-surface-alt disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={isPending}
                    className={`px-4 py-2 rounded text-white disabled:opacity-50 ${
                      checkResult.willDeductCredit
                        ? 'bg-error hover:bg-error/80'
                        : 'bg-primary hover:bg-accent'
                    }`}
                  >
                    {isPending ? 'Cancelando...' : 'Confirmar cancelación'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
