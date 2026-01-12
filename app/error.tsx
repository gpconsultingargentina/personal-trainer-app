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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Algo salió mal</h2>
        <p className="text-gray-600">{error?.message || 'Ocurrió un error inesperado'}</p>
        <div className="space-y-2 mt-4">
          <button
            onClick={() => {
              reset()
            }}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Intentar de nuevo
          </button>
          {!isLoginPage && (
            <button
              onClick={() => {
                router.push('/login')
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Ir al Login
            </button>
          )}
          <button
            onClick={() => {
              router.push('/')
            }}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
