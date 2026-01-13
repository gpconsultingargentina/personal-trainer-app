'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRecurringBookings } from '@/app/actions/bookings'
import TimeInput from '@/app/components/time-input/TimeInput'

interface AddClassToStudentProps {
  studentId: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const DURATION_OPTIONS = [
  { value: 1, label: '1 semana' },
  { value: 2, label: '2 semanas' },
  { value: 4, label: '4 semanas' },
  { value: 8, label: '8 semanas' },
  { value: 12, label: '12 semanas' },
  { value: 24, label: '6 meses' },
  { value: 52, label: '1 año' },
]

export default function AddClassToStudent({ studentId }: AddClassToStudentProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState(4)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [maxCapacity, setMaxCapacity] = useState(1)
  const [timeSlots, setTimeSlots] = useState<{ [key: number]: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
      // Limpiar el horario si se deselecciona el día
      const newTimeSlots = { ...timeSlots }
      delete newTimeSlots[day]
      setTimeSlots(newTimeSlots)
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const setTimeForDay = (day: number, time: string) => {
    setTimeSlots({ ...timeSlots, [day]: time })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selectedDays.length === 0) {
      setError('Debes seleccionar al menos un día de la semana')
      return
    }

    if (!startDate) {
      setError('Debes seleccionar una fecha de inicio')
      return
    }

    // Verificar que todos los días seleccionados tengan horario
    const missingTimes = selectedDays.filter(day => !timeSlots[day])
    if (missingTimes.length > 0) {
      setError('Debes asignar un horario a todos los días seleccionados')
      return
    }

    setSubmitting(true)

    try {
      // Preparar los datos para crear las clases recurrentes
      const scheduleData = {
        studentId,
        startDate,
        durationWeeks: duration,
        durationMinutes,
        maxCapacity,
        schedule: selectedDays.map(day => ({
          dayOfWeek: day,
          time: timeSlots[day],
        })),
      }

      await createRecurringBookings(scheduleData)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear las clases')
      setSubmitting(false)
    }
  }

  // Calcular fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Agregar Clases
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Agendar Clases Recurrentes</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración de las Clases (minutos) *
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  min="15"
                  step="15"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Capacidad máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad Máxima por Clase *
                </label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                  min="1"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Período de repetición */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repetir durante *
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {DURATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Días de la semana y horarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de la Semana y Horarios *
                </label>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = selectedDays.includes(day.value)
                    return (
                      <div
                        key={day.value}
                        className={`p-3 border rounded-md ${
                          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDay(day.value)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {day.label}
                            </span>
                          </label>
                          {isSelected && (
                            <div className="ml-4">
                              <TimeInput
                                value={timeSlots[day.value] || '00:00'}
                                onChange={(value) => setTimeForDay(day.value, value)}
                                required={isSelected}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumen */}
              {selectedDays.length > 0 && startDate && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resumen:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      Se crearán clases para {selectedDays.length} día(s) por semana
                    </li>
                    <li>
                      Durante {DURATION_OPTIONS.find(o => o.value === duration)?.label.toLowerCase()}
                    </li>
                    <li>
                      Total aproximado: {selectedDays.length * duration} clases
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creando clases...' : 'Crear Clases'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
