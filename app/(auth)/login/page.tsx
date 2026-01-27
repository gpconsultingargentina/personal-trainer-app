'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/app/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Crear cliente de Supabase de forma segura
  const { supabase, configError } = useMemo(() => {
    try {
      const client = createClient()
      return { supabase: client, configError: null }
    } catch (err) {
      return {
        supabase: null,
        configError: err instanceof Error ? err.message : 'Error desconocido de configuración',
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      setError('Error de configuración: No se pudo inicializar el cliente de Supabase')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Obtener el rol del usuario para redirigir correctamente
        const { data: { user } } = await supabase.auth.getUser()
        const role = user?.user_metadata?.role

        // Usar window.location para forzar navegación completa
        // Esto asegura que las cookies de sesión se envíen correctamente
        if (role === 'student') {
          window.location.href = '/portal'
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  // Si hay error de configuración, mostrar mensaje
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-error mb-4">
              Error de Configuración
            </h2>
            <p className="text-foreground mb-4">{configError}</p>
            <p className="text-sm text-muted">
              Por favor, verifica que el archivo <code className="bg-surface-alt px-2 py-1 rounded">.env.local</code> existe y contiene las variables de entorno necesarias.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded shadow-md">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Otakufiit"
            width={80}
            height={80}
            className="mx-auto rounded"
          />
          <h2 className="mt-4 text-3xl font-extrabold text-foreground">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-muted">
            Otakufiit - Gestion de Clases
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-border placeholder-muted text-background rounded-t focus:outline-none focus:ring-primary focus:border-primary focus:z-10 text-base"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-border placeholder-muted text-background rounded-b focus:outline-none focus:ring-primary focus:border-primary focus:z-10 text-base"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded text-background bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
