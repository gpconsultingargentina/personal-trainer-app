'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClassAndBookForStudent, createRecurringClassesForStudent } from '@/app/actions/classes'

interface StudentClassFormProps {
  studentId: string
  studentName: string
}

export default function StudentClassForm({ studentId, studentName }: StudentClassFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'recurring'>('single')
  
  // Estados para modo simple (una clase)
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('00')
  const [minute, setMinute] = useState('00')
  
  // Estados para modo recurrente
  const [startDate, setStartDate] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1]) // Array de días seleccionados (1 = Lunes, etc.)
  const [dayTimes, setDayTimes] = useState<{ [key: number]: { hour: string; minute: string } }>({
    1: { hour: hour, minute: minute }, // Inicializar con hora actual
  }) // Objeto que mapea día -> { hora, minuto }
  const [repeatWeeks, setRepeatWeeks] = useState('unlimited')
  
  const weekDays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ]
  
  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        // Si está seleccionado, quitarlo (pero mantener al menos uno)
        if (prev.length > 1) {
          // Eliminar la hora asociada
          setDayTimes(prevTimes => {
            const newTimes = { ...prevTimes }
            delete newTimes[dayValue]
            return newTimes
          })
          return prev.filter(d => d !== dayValue)
        }
        return prev
      } else {
        // Si no está seleccionado, agregarlo (máximo 5)
        if (prev.length < 5) {
          // Inicializar con la hora por defecto
          setDayTimes(prevTimes => ({
            ...prevTimes,
            [dayValue]: { hour: hour, minute: minute }
          }))
          return [...prev, dayValue].sort((a, b) => a - b)
        }
        return prev
      }
    })
  }

  const updateDayTime = (dayValue: number, type: 'hour' | 'minute', value: string) => {
    setDayTimes(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [type]: value
      }
    }))
  }
  
  // Inicializar con valores por defecto
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const defaultHour = String(now.getHours()).padStart(2, '0')
    const defaultMinute = String(now.getMinutes()).padStart(2, '0')
    
    setDate(`${year}-${month}-${day}`)
    setStartDate(`${year}-${month}-${day}`)
    setHour(defaultHour)
    setMinute(defaultMinute)
    
    // Inicializar la hora para el día por defecto (Lunes = 1)
    setDayTimes({
      1: { hour: defaultHour, minute: defaultMinute }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      if (mode === 'single') {
        // Modo simple: una clase única
        const scheduledAt = `${date}T${hour}:${minute}`
        formData.set('scheduled_at', scheduledAt)
        await createClassAndBookForStudent(studentId, formData)
      } else {
        // Modo recurrente: múltiples clases
        if (selectedDays.length === 0) {
          setError('Debes seleccionar al menos un día de la semana')
          setLoading(false)
          return
        }
        
        // Verificar que todos los días seleccionados tengan hora configurada
        const missingTimes = selectedDays.filter(day => !dayTimes[day])
        if (missingTimes.length > 0) {
          setError('Todos los días seleccionados deben tener una hora configurada')
          setLoading(false)
          return
        }
        
        // Preparar el objeto con días y sus horas
        const daysWithTimes = selectedDays.map(day => ({
          day: day,
          hour: parseInt(dayTimes[day].hour),
          minute: parseInt(dayTimes[day].minute)
        }))
        
        formData.set('start_date', startDate)
        formData.set('days_with_times', JSON.stringify(daysWithTimes))
        formData.set('repeat_weeks', repeatWeeks)
        
        const result = await createRecurringClassesForStudent(studentId, formData)
        
        if (result.errors > 0) {
          setError(`Se crearon ${result.created} clases, pero ${result.errors} fallaron. Revisa los detalles.`)
        }
      }
      
      router.push(`/dashboard/students/${studentId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear las clases')
      setLoading(false)
    }
  }

  // Generar opciones para horas (00-23) y minutos (00-59)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-primary/10 border border-primary rounded p-4">
        <p className="text-sm text-primary">
          Las clases se crearán y se reservarán automáticamente para <strong>{studentName}</strong>
        </p>
      </div>

      {/* Selector de modo */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Tipo de Clase *
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="single"
              checked={mode === 'single'}
              onChange={(e) => setMode(e.target.value as 'single' | 'recurring')}
              className="mr-2"
            />
            <span className="text-sm">Una clase única</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="recurring"
              checked={mode === 'recurring'}
              onChange={(e) => setMode(e.target.value as 'single' | 'recurring')}
              className="mr-2"
            />
            <span className="text-sm">Clases recurrentes (semanal)</span>
          </label>
        </div>
      </div>

      {mode === 'single' ? (
        /* Modo simple: una clase única */
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Fecha y Hora * (Formato 24 horas)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-xs font-medium text-muted mb-1">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                required={mode === 'single'}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="hour" className="block text-xs font-medium text-muted mb-1">
                Hora (00-23)
              </label>
              <select
                id="hour"
                required={mode === 'single'}
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="minute" className="block text-xs font-medium text-muted mb-1">
                Minutos (00-59)
              </label>
              <select
                id="minute"
                required={mode === 'single'}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            Hora seleccionada: {date ? `${date} ${hour}:${minute}` : 'Selecciona fecha y hora'}
          </p>
        </div>
      ) : (
        /* Modo recurrente: múltiples clases semanales */
        <div className="space-y-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-muted mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              id="start_date"
              required={mode === 'recurring'}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Días de la Semana * (Selecciona 1-5 días y configura la hora para cada uno)
            </label>
            <div className="space-y-3 mt-2">
              {weekDays.map((day) => {
                const isSelected = selectedDays.includes(day.value)
                const dayTime = dayTimes[day.value] || { hour: hour, minute: minute }
                
                return (
                  <div
                    key={day.value}
                    className={`p-4 border-2 rounded transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDay(day.value)}
                          disabled={!isSelected && selectedDays.length >= 5}
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <span className={`ml-3 text-sm font-medium ${
                          isSelected ? 'text-primary' : 'text-muted'
                        }`}>
                          {day.label}
                        </span>
                      </label>
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <label htmlFor={`hour_${day.value}`} className="text-sm text-muted">
                              Hora:
                            </label>
                            <select
                              id={`hour_${day.value}`}
                              value={dayTime.hour}
                              onChange={(e) => updateDayTime(day.value, 'hour', e.target.value)}
                              className="block w-16 sm:w-20 rounded border-border shadow-sm focus:border-primary focus:ring-primary text-base py-2"
                            >
                              {hours.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="text-muted">:</span>
                          <div className="flex items-center space-x-1">
                            <label htmlFor={`minute_${day.value}`} className="text-sm text-muted">
                              Min:
                            </label>
                            <select
                              id={`minute_${day.value}`}
                              value={dayTime.minute}
                              onChange={(e) => updateDayTime(day.value, 'minute', e.target.value)}
                              className="block w-16 sm:w-20 rounded border-border shadow-sm focus:border-primary focus:ring-primary text-base py-2"
                            >
                              {minutes.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <p className="text-xs text-muted ml-7">
                        Clase a las {dayTime.hour}:{dayTime.minute}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              {selectedDays.length === 0
                ? 'Selecciona al menos un día'
                : `${selectedDays.length} día(s) seleccionado(s)`}
            </p>
          </div>

          <div>
            <label htmlFor="repeat_weeks" className="block text-sm font-medium text-muted">
              Repetir durante *
            </label>
            <select
              id="repeat_weeks"
              required={mode === 'recurring'}
              value={repeatWeeks}
              onChange={(e) => setRepeatWeeks(e.target.value)}
              className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="4">4 semanas (1 mes)</option>
              <option value="8">8 semanas (2 meses)</option>
              <option value="12">12 semanas (3 meses)</option>
              <option value="24">24 semanas (6 meses)</option>
              <option value="52">52 semanas (1 año)</option>
              <option value="unlimited">Indefinidamente (1 año)</option>
            </select>
            <p className="mt-1 text-xs text-muted">
              {repeatWeeks === 'unlimited'
                ? 'Se crearán clases para 1 año (52 semanas)'
                : `Se crearán clases para ${repeatWeeks} semanas`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="duration_minutes"
            className="block text-sm font-medium text-muted"
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
            defaultValue={60}
            className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="max_capacity"
            className="block text-sm font-medium text-muted"
          >
            Capacidad Máxima *
          </label>
          <input
            type="number"
            id="max_capacity"
            name="max_capacity"
            min="1"
            required
            defaultValue={1}
            className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-muted"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue=""
          className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
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
          {loading
            ? (mode === 'recurring' ? 'Creando clases...' : 'Creando...')
            : (mode === 'recurring' ? 'Crear Clases Recurrentes' : 'Crear y Reservar Clase')}
        </button>
      </div>
    </form>
  )
}

