'use client'

import { useState, useEffect } from 'react'
import TimeInput from '@/app/components/time-input/TimeInput'

interface DateTimeInputProps {
  id: string
  name: string
  required?: boolean
  defaultValue?: string
  className?: string
  label?: string
}

/**
 * Componente de entrada de fecha y hora que garantiza formato 24 horas
 * Usa input de fecha + componente TimeInput personalizado (formato 24h obligatorio)
 */
export default function DateTimeInput({
  id,
  name,
  required = false,
  defaultValue = '',
  className = '',
  label,
}: DateTimeInputProps) {
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('')

  useEffect(() => {
    if (defaultValue) {
      // Formato esperado: YYYY-MM-DDTHH:mm
      const [date, time] = defaultValue.split('T')
      setDateValue(date || '')
      setTimeValue(time || '')
    }
  }, [defaultValue])

  // Valor combinado en formato datetime-local para el formulario
  const datetimeValue = dateValue && timeValue ? `${dateValue}T${timeValue}` : ''

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-3 items-center">
        <input
          type="date"
          id={`${id}_date`}
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          required={required}
          className={`flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
        />
        <div className="flex-1">
          <TimeInput
            value={timeValue}
            onChange={(value) => setTimeValue(value)}
            required={required}
            className={className}
          />
        </div>
      </div>
      {/* Input oculto con el valor completo para el formulario */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={datetimeValue}
      />
    </div>
  )
}