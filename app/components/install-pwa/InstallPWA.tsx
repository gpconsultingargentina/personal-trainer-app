'use client'

import { useState, useEffect } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(isIOSDevice)

    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      return // Ya está instalada
    }

    // En iOS mostrar opción manual
    if (isIOSDevice) {
      setIsInstallable(true)
      return
    }

    // Para Android/Desktop capturar evento
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  if (!isInstallable) return null

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-primary hover:bg-surface-alt hover:border-primary"
      >
        <span className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Instalar App
        </span>
      </button>

      {/* Modal instrucciones iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Instalar en iPhone/iPad
            </h3>
            <ol className="text-sm text-muted space-y-3">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>
                  Toca el boton <strong>Compartir</strong>{' '}
                  <svg className="inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Desplazate y toca <strong>&quot;Agregar a inicio&quot;</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Toca <strong>&quot;Agregar&quot;</strong> en la esquina superior</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="mt-6 w-full py-2 bg-primary text-white rounded font-medium hover:bg-accent"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
