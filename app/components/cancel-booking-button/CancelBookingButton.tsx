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
  onCancelled?: () => void
}

export default function CancelBookingButton({ bookingId, onCancelled }: Props) {
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
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cancelar')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={checking || isPending}
        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {checking ? 'Verificando...' : 'Cancelar'}
      </button>

      {error && !showModal && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}

      {/* Modal de confirmación */}
      {showModal && checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancelar clase
            </h3>

            {!checkResult.canCancel ? (
              <>
                <p className="text-gray-600 mb-4">{checkResult.message}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
                    <div className={`p-3 rounded-lg ${
                      checkResult.willDeductCredit
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <p className={`text-sm ${
                        checkResult.willDeductCredit ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {checkResult.willDeductCredit ? '⚠️' : '⏰'} {checkResult.message}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-700">
                        ✓ {checkResult.message}
                      </p>
                    </div>
                  )}

                  {checkResult.toleranceInfo && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Tu tolerancia mensual:</strong>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {checkResult.toleranceInfo.used} de {checkResult.toleranceInfo.tolerance} cancelaciones tardías usadas este mes
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    Tiempo hasta la clase: {Math.floor(checkResult.hoursUntilClass)}h {Math.round((checkResult.hoursUntilClass % 1) * 60)}min
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={isPending}
                    className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                      checkResult.willDeductCredit
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
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
