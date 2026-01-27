'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteMultipleClasses } from '@/app/actions/classes'
import { formatDateTime24h } from '@/app/lib/utils'
import DeleteButton from '@/app/components/delete-button/DeleteButton'
import { deleteClass, type Class } from '@/app/actions/classes'

interface ClassesListProps {
  classes: Class[]
}

export default function ClassesList({ classes }: ClassesListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const allSelected = classes.length > 0 && selectedIds.size === classes.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < classes.length

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
      setSelectedIds(new Set(classes.map(c => c.id)))
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

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} clase(s) seleccionada(s)? Esto también eliminará todas las reservas asociadas.`)) {
      return
    }

    startTransition(async () => {
      try {
        await deleteMultipleClasses(Array.from(selectedIds))
        setSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al eliminar las clases')
      }
    })
  }

  if (classes.length === 0) {
    return (
      <li className="px-6 py-4 text-center text-gray-500">
        No hay clases creadas aún
      </li>
    )
  }

  return (
    <>
      {/* Barra de acciones con selección masiva */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <label className="flex items-center cursor-pointer">
          <span className="p-2 -m-2">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </span>
          <span className="ml-3 text-sm font-medium text-gray-700">
            Seleccionar todas ({classes.length})
          </span>
        </label>
        {selectedIds.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={isPending}
            className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? 'Eliminando...' : `Eliminar ${selectedIds.size}`}
          </button>
        )}
      </div>

      {classes.map((classItem) => {
        const isSelected = selectedIds.has(classItem.id)

        return (
          <li key={classItem.id}>
            <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
              <span className="p-2 -m-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(classItem.id)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </span>
              <div className="flex-1 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {formatDateTime24h(classItem.scheduled_at)}
                    </h3>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        classItem.status === 'scheduled'
                          ? 'bg-green-100 text-green-800'
                          : classItem.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {classItem.status === 'scheduled'
                        ? 'Programada'
                        : classItem.status === 'completed'
                        ? 'Completada'
                        : 'Cancelada'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Duración: {classItem.duration_minutes} min | Capacidad:{' '}
                    {classItem.current_bookings}/{classItem.max_capacity}
                  </p>
                  {classItem.students && classItem.students.length > 0 && (
                    <p className="mt-1 text-sm text-gray-700 font-medium">
                      {classItem.students.map((student: { id: string; name: string }) => student.name).join(', ')}
                    </p>
                  )}
                  {classItem.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {classItem.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Link
                    href={`/dashboard/classes/${classItem.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </Link>
                  <DeleteButton
                    action={deleteClass.bind(null, classItem.id)}
                    confirmMessage="¿Estás seguro de que quieres eliminar esta clase?"
                  />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </>
  )
}
