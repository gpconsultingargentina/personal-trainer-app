'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Evitar redirigir a /login si ya estamos en /login para prevenir loops
  const isLoginPage = pathname === '/login'

  // Prevenir loops infinitos - si estamos en login y hay error, no hacer nada automático
  useEffect(() => {
    // Solo loguear el error, no hacer redirecciones automáticas
    if (error) {
      console.error('Error en página:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-4 p-8 bg-surface rounded shadow-md text-center">
        <h2 className="text-2xl font-bold text-foreground">Algo salió mal</h2>
        <p className="text-muted">{error?.message || 'Ocurrió un error inesperado'}</p>
        <div className="space-y-2 mt-4">
          <button
            onClick={() => {
              reset()
            }}
            className="w-full px-4 py-2 bg-primary text-background rounded hover:bg-accent"
          >
            Intentar de nuevo
          </button>
          {!isLoginPage && (
            <button
              onClick={() => {
                router.push('/login')
              }}
              className="w-full px-4 py-2 bg-surface-alt text-foreground rounded hover:bg-border"
            >
              Ir al Login
            </button>
          )}
          <button
            onClick={() => {
              router.push('/')
            }}
            className="w-full px-4 py-2 bg-border text-foreground rounded hover:bg-muted"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
