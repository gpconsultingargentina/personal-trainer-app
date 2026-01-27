'use client'

import { useState, useEffect } from 'react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export default function TimeInput({ value, onChange, required, className }: TimeInputProps) {
  const [hours, setHours] = useState('00')
  const [minutes, setMinutes] = useState('00')

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHours(h || '00')
      setMinutes(m || '00')
    }
  }, [value])

  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value
    setHours(newHours)
    onChange(`${newHours}:${minutes}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value
    setMinutes(newMinutes)
    onChange(`${hours}:${newMinutes}`)
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = String(i).padStart(2, '0')
    return (
      <option key={hour} value={hour}>
        {hour}
      </option>
    )
  })

  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    if (i % 15 === 0) {
      const minute = String(i).padStart(2, '0')
      return (
        <option key={minute} value={minute}>
          {minute}
        </option>
      )
    }
    return null
  }).filter(Boolean)

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <select
        value={hours}
        onChange={handleHoursChange}
        required={required}
        className="rounded border-border shadow-sm focus:border-primary focus:ring-primary text-sm"
        style={{ fontFamily: 'monospace' }}
      >
        {hourOptions}
      </select>
      <span className="text-muted font-bold">:</span>
      <select
        value={minutes}
        onChange={handleMinutesChange}
        required={required}
        className="rounded border-border shadow-sm focus:border-primary focus:ring-primary text-sm"
        style={{ fontFamily: 'monospace' }}
      >
        {minuteOptions}
      </select>
    </div>
  )
}
