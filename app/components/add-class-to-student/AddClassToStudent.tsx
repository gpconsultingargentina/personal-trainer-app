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
        className="px-4 py-2 bg-primary text-white rounded hover:bg-accent"
      >
        Agregar Clases
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Agendar Clases Recurrentes</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-muted hover:text-foreground hover:bg-background rounded-full"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  required
                  className="w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Duración de las Clases (minutos) *
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  min="15"
                  step="15"
                  required
                  className="w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Capacidad máxima */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Capacidad Máxima por Clase *
                </label>
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                  min="1"
                  required
                  className="w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Período de repetición */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Repetir durante *
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                  className="w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary"
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
                <label className="block text-sm font-medium text-muted mb-2">
                  Días de la Semana y Horarios *
                </label>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = selectedDays.includes(day.value)
                    return (
                      <div
                        key={day.value}
                        className={`p-3 border rounded ${
                          isSelected ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDay(day.value)}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="ml-2 text-sm font-medium text-muted">
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
                <div className="bg-background p-4 rounded">
                  <p className="text-sm font-medium text-muted mb-2">Resumen:</p>
                  <ul className="text-sm text-muted space-y-1">
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

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 border border-border rounded text-muted hover:bg-surface-alt"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-3 bg-primary text-white rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
