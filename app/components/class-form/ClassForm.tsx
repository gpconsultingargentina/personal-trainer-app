'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClass, updateClass, type Class } from '@/app/actions/classes'
import TimeInput from '@/app/components/time-input/TimeInput'

interface ClassFormProps {
  classData?: Class | null
}

export default function ClassForm({ classData }: ClassFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('00:00')

  // Inicializar fecha y hora desde classData
  useEffect(() => {
    if (classData) {
      const dateObj = new Date(classData.scheduled_at)
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      setDate(`${year}-${month}-${day}`)
      
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      setTime(`${hours}:${minutes}`)
    }
  }, [classData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Combinar fecha y hora en formato datetime-local
      const scheduledAt = `${date}T${time}`
      formData.set('scheduled_at', scheduledAt)

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Fecha *
          </label>
          <input
            type="date"
            id="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700"
          >
            Hora (24h) *
          </label>
          <div className="mt-1">
            <TimeInput
              value={time}
              onChange={setTime}
              required
              className="w-full"
            />
          </div>
        </div>
      </div>
      {/* Input oculto para el formulario */}
      <input type="hidden" name="scheduled_at" value={date && time ? `${date}T${time}` : ''} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : classData ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

