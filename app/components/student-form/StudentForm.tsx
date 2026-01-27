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
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-muted"
        >
          Nombre y Apellido *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={student?.name}
          className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-muted"
        >
          E-mail *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          defaultValue={student?.email}
          className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-muted"
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
          className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary text-base py-2"
        />
      </div>

      {frequencies.length > 0 && (
        <div>
          <label
            htmlFor="frequency_id"
            className="block text-sm font-medium text-muted"
          >
            Frecuencia Habitual
          </label>
          <select
            id="frequency_id"
            name="frequency_id"
            value={frequencyId}
            onChange={(e) => setFrequencyId(e.target.value)}
            className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Sin frecuencia asignada</option>
            {frequencies.map((freq) => (
              <option key={freq.id} value={freq.id}>
                {freq.description} - ${freq.price_per_class.toLocaleString('es-AR')}/clase
              </option>
            ))}
          </select>
          {selectedFrequency && (
            <p className="mt-1 text-sm text-muted">
              Precio por clase: ${selectedFrequency.price_per_class.toLocaleString('es-AR')}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-3 border border-border rounded shadow-sm text-sm font-medium text-muted bg-surface hover:bg-surface-alt"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
