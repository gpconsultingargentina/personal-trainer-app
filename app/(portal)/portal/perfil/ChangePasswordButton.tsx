'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

export default function ChangePasswordButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 2000)
      }
    } catch {
      setError('Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-border rounded shadow-sm text-sm font-medium text-muted bg-surface hover:bg-surface-alt"
      >
        Cambiar contraseña
      </button>
    )
  }

  if (success) {
    return (
      <div className="bg-success/10 border border-success/20 rounded p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-success">Contraseña actualizada correctamente</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-muted">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-border rounded shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Minimo 6 caracteres"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted">
          Confirmar nueva contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-border rounded shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Repetir contraseña"
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setError(null)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          }}
          className="inline-flex items-center px-4 py-2 border border-border rounded shadow-sm text-sm font-medium text-muted bg-surface hover:bg-surface-alt"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
