'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteMultipleBookings } from '@/app/actions/bookings'
import { formatDateTime24h } from '@/app/lib/utils'
import DeleteButton from '@/app/components/delete-button/DeleteButton'
import { deleteBooking } from '@/app/actions/bookings'

interface Booking {
  id: string
  status: 'confirmed' | 'cancelled' | 'completed'
  classes: {
    id: string
    scheduled_at: string
  }
}

interface StudentBookingsListProps {
  bookings: Booking[]
}

export default function StudentBookingsList({ bookings }: StudentBookingsListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const selectAllRef = useRef<HTMLInputElement>(null)

  // Filtrar solo las clases confirmadas para mostrar checkboxes
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const allSelected = confirmedBookings.length > 0 && selectedIds.size === confirmedBookings.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < confirmedBookings.length

  // Establecer estado indeterminado del checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(confirmedBookings.map(b => b.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} clase(s) seleccionada(s)?`)) {
      return
    }

    startTransition(async () => {
      try {
        await deleteMultipleBookings(Array.from(selectedIds))
        setSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al eliminar las clases')
      }
    })
  }

  if (bookings.length === 0) {
    return <p className="text-gray-500">No hay clases reservadas</p>
  }

  return (
    <div>
      {/* Barra de acciones con selección masiva */}
      {confirmedBookings.length > 0 && (
        <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allSelected}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Seleccionar todas ({confirmedBookings.length})
            </span>
          </label>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isPending ? 'Eliminando...' : `Eliminar ${selectedIds.size} seleccionada(s)`}
            </button>
          )}
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {bookings.map((booking) => {
          const isConfirmed = booking.status === 'confirmed'
          const isSelected = selectedIds.has(booking.id)

          return (
            <li key={booking.id} className="py-4">
              <div className="flex items-center gap-3">
                {/* Checkbox solo para clases confirmadas */}
                {isConfirmed && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(booking.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )}
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime24h(booking.classes.scheduled_at)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estado: {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </p>
                  </div>
                  {isConfirmed && (
                    <div className="ml-4 flex space-x-2">
                      <Link
                        href={`/dashboard/classes/${booking.classes.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        action={async () => {
                          await deleteBooking(booking.id)
                        }}
                        confirmMessage="¿Estás seguro de que quieres eliminar esta clase? Esto eliminará la clase completa y todas las reservas asociadas."
                        label="Eliminar"
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
