'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { validateRegistrationToken } from '@/app/actions/registration'
import { registerStudent } from '@/app/actions/auth'

type StudentInfo = {
  id: string
  name: string
  email: string
}

function RegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentInfo | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No se proporcionó un token de registro')
        setLoading(false)
        return
      }

      try {
        const result = await validateRegistrationToken(token)

        if (!result.valid || !result.student) {
          setError('El enlace de registro es inválido o ha expirado')
        } else {
          setStudent(result.student)
        }
      } catch {
        setError('Error al validar el enlace de registro')
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !student) {
      setError('Token inválido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setValidating(true)
    setError(null)

    try {
      const result = await registerStudent(token, password)

      if (result.success) {
        setSuccess(true)
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error || 'Error al crear la cuenta')
      }
    } catch {
      setError('Error al procesar el registro')
    } finally {
      setValidating(false)
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted">Validando enlace de registro...</p>
        </div>
      </div>
    )
  }

  // Token inválido o error
  if (error && !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error/10">
              <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              Enlace Inválido
            </h2>
            <p className="mt-2 text-muted">{error}</p>
            <p className="mt-4 text-sm text-muted">
              Si necesitas un nuevo enlace de registro, contacta a tu entrenador.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Registro exitoso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              Cuenta Creada
            </h2>
            <p className="mt-2 text-muted">
              Tu cuenta ha sido creada exitosamente.
            </p>
            <p className="mt-2 text-sm text-muted">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de registro
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
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-muted">
            Bienvenido/a, {student?.name}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={student?.email || ''}
                className="mt-1 block w-full px-3 py-3 border border-border rounded bg-surface-alt text-muted cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted">
                Este será tu email para iniciar sesión
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-3 border border-border rounded shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-3 border border-border rounded shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Repetir contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={validating}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-base font-medium text-background bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-primary hover:text-accent">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted">Cargando...</p>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegistroForm />
    </Suspense>
  )
}
