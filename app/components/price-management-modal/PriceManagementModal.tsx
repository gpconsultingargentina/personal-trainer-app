'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getFrequencies,
  updateFrequencyPrice,
  toggleFrequencyActive,
  type FrequencyPrice,
} from '@/app/actions/frequencies'

export default function PriceManagementModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [frequencies, setFrequencies] = useState<FrequencyPrice[]>([])
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadFrequencies()
    }
  }, [isOpen])

  const loadFrequencies = async () => {
    try {
      const data = await getFrequencies()
      setFrequencies(data)
      const prices: Record<string, string> = {}
      data.forEach((f) => {
        prices[f.id] = f.price_per_class.toString()
      })
      setEditingPrices(prices)
    } catch (error) {
      console.error('Error loading frequencies:', error)
    }
  }

  const handleSavePrice = (id: string) => {
    const newPrice = parseFloat(editingPrices[id])
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('El precio debe ser un numero mayor a 0')
      return
    }

    setSavingId(id)
    startTransition(async () => {
      try {
        await updateFrequencyPrice(id, newPrice)
        await loadFrequencies()
        router.refresh()
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al guardar'
        alert(msg)
      } finally {
        setSavingId(null)
      }
    })
  }

  const handleToggleActive = (id: string, currentActive: boolean) => {
    setSavingId(id)
    startTransition(async () => {
      try {
        await toggleFrequencyActive(id, !currentActive)
        await loadFrequencies()
        router.refresh()
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al cambiar estado'
        alert(msg)
      } finally {
        setSavingId(null)
      }
    })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Gestionar Precios
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Gestionar Precios
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-foreground p-1"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {frequencies.length === 0 ? (
              <p className="text-muted text-center py-8">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {frequencies.map((freq) => (
                  <div
                    key={freq.id}
                    className={`p-4 border rounded-lg ${
                      freq.is_active ? 'border-border' : 'border-border bg-surface-alt opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {freq.frequency_code.toUpperCase()}
                          </span>
                          <span className="text-sm text-muted">
                            ({freq.classes_per_week} clase{freq.classes_per_week > 1 ? 's' : ''}/semana)
                          </span>
                          {!freq.is_active && (
                            <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {freq.description && (
                          <p className="text-sm text-muted mt-1">{freq.description}</p>
                        )}
                        <p className="text-sm text-muted mt-1">
                          Precio actual: {formatPrice(freq.price_per_class)}
                        </p>
                      </div>

                      {/* Price input */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                          <input
                            type="number"
                            value={editingPrices[freq.id] || ''}
                            onChange={(e) =>
                              setEditingPrices((prev) => ({
                                ...prev,
                                [freq.id]: e.target.value,
                              }))
                            }
                            className="w-32 pl-7 pr-3 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            min="0"
                            step="100"
                          />
                        </div>
                        <button
                          onClick={() => handleSavePrice(freq.id)}
                          disabled={isPending && savingId === freq.id}
                          className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending && savingId === freq.id ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>

                    {/* Toggle active */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => handleToggleActive(freq.id, freq.is_active)}
                        disabled={isPending && savingId === freq.id}
                        className={`text-sm ${
                          freq.is_active
                            ? 'text-error hover:text-error/80'
                            : 'text-primary hover:text-primary/80'
                        } disabled:opacity-50`}
                      >
                        {freq.is_active ? 'Desactivar plan' : 'Activar plan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-border">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-muted hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
