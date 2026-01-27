'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStudent, type Student } from '@/app/actions/students'
import type { FrequencyPrice } from '@/app/actions/frequencies'

interface StudentFormProps {
  student?: Student | null
  frequencies?: FrequencyPrice[]
}

export default function StudentForm({ student, frequencies = [] }: StudentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frequencyId, setFrequencyId] = useState<string>(student?.frequency_id || '')

  const selectedFrequency = frequencies.find((f) => f.id === frequencyId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      if (frequencyId) {
        formData.set('frequency_id', frequencyId)
      }
      await createStudent(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el alumno')
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

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre y Apellido *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={student?.name}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          E-mail *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          defaultValue={student?.email}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Celular *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={student?.phone || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2"
        />
      </div>

      {frequencies.length > 0 && (
        <div>
          <label
            htmlFor="frequency_id"
            className="block text-sm font-medium text-gray-700"
          >
            Frecuencia Habitual
          </label>
          <select
            id="frequency_id"
            name="frequency_id"
            value={frequencyId}
            onChange={(e) => setFrequencyId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Sin frecuencia asignada</option>
            {frequencies.map((freq) => (
              <option key={freq.id} value={freq.id}>
                {freq.description} - ${freq.price_per_class.toLocaleString('es-AR')}/clase
              </option>
            ))}
          </select>
          {selectedFrequency && (
            <p className="mt-1 text-sm text-gray-500">
              Precio por clase: ${selectedFrequency.price_per_class.toLocaleString('es-AR')}
            </p>
          )}
        </div>
      )}

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
          {loading ? 'Guardando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
