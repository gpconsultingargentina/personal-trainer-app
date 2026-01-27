'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteStudents, type Student } from '@/app/actions/students'
import { useRouter } from 'next/navigation'

interface StudentsListProps {
  students: Student[]
}

export default function StudentsList({ students }: StudentsListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map(s => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return
    }

    const count = selectedIds.size
    const names = students
      .filter(s => selectedIds.has(s.id))
      .map(s => s.name)
      .join(', ')

    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar ${count} alumno(s)?\n\n${names}\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await deleteStudents(Array.from(selectedIds))
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar alumnos')
    } finally {
      setLoading(false)
    }
  }

  if (students.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 text-center text-gray-500">
          No hay alumnos registrados
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-md p-4">
          <span className="text-indigo-700 font-medium">
            {selectedIds.size} alumno(s) seleccionado(s)
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Eliminando...' : `Eliminar ${selectedIds.size} seleccionado(s)`}
          </button>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <li className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
            <label className="flex items-center cursor-pointer">
              <span className="p-2 -m-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === students.length && students.length > 0}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </span>
              <span className="ml-3 text-sm font-medium text-gray-700">Seleccionar todos</span>
            </label>
          </li>
          {students.map((student) => (
            <li key={student.id}>
              <div className="px-4 sm:px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <span className="p-2 -m-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </span>
                  <Link href={`/dashboard/students/${student.id}`} className="flex-1 ml-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{student.email}</p>
                        {student.phone && (
                          <p className="mt-1 text-sm text-gray-500">{student.phone}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">→</div>
                    </div>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

