'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClass, updateClass, type Class } from '@/app/actions/classes'

interface ClassFormProps {
  classData?: Class | null
}

export default function ClassForm({ classData }: ClassFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      if (classData) {
        await updateClass(classData.id, formData)
      } else {
        await createClass(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la clase')
      setLoading(false)
    }
  }

  const defaultDateTime = classData
    ? new Date(classData.scheduled_at).toISOString().slice(0, 16)
    : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="scheduled_at"
          className="block text-sm font-medium text-gray-700"
        >
          Fecha y Hora *
        </label>
        <input
          type="datetime-local"
          id="scheduled_at"
          name="scheduled_at"
          required
          defaultValue={defaultDateTime}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="duration_minutes"
            className="block text-sm font-medium text-gray-700"
          >
            Duración (minutos) *
          </label>
          <input
            type="number"
            id="duration_minutes"
            name="duration_minutes"
            min="15"
            step="15"
            required
            defaultValue={classData?.duration_minutes || 60}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="max_capacity"
            className="block text-sm font-medium text-gray-700"
          >
            Capacidad Máxima *
          </label>
          <input
            type="number"
            id="max_capacity"
            name="max_capacity"
            min="1"
            required
            defaultValue={classData?.max_capacity || 1}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {classData && (
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Estado *
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={classData.status}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="scheduled">Programada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={classData?.description || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : classData ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

