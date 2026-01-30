'use client'

import { useState } from 'react'

type Props = {
  calendarToken: string | null
}

export default function CalendarButtons({ calendarToken }: Props) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    // Trigger descarga del .ics
    window.location.href = '/api/calendar/export'
  }

  const handleSubscribe = async () => {
    if (!calendarToken) {
      alert('No hay token de calendario disponible')
      return
    }

    // Construir URL de suscripción
    const baseUrl = window.location.origin
    const subscribeUrl = `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/subscribe/${calendarToken}`

    // Copiar al portapapeles
    try {
      await navigator.clipboard.writeText(subscribeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      prompt('Copia esta URL para suscribirte:', subscribeUrl)
    }
  }

  const handleOpenSubscription = () => {
    if (!calendarToken) {
      alert('No hay token de calendario disponible')
      return
    }

    const baseUrl = window.location.origin
    const subscribeUrl = `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/subscribe/${calendarToken}`

    // Intentar abrir directamente
    window.location.href = subscribeUrl
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-accent transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Agregar a calendario
      </button>

      {calendarToken && (
        <>
          <button
            type="button"
            onClick={handleOpenSubscription}
            className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm font-medium rounded hover:bg-success/80 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Suscribirse
          </button>

          <button
            type="button"
            onClick={handleSubscribe}
            className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground text-sm font-medium rounded hover:bg-surface-alt transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            {copied ? 'Copiado!' : 'Copiar URL'}
          </button>
        </>
      )}
    </div>
  )
}
