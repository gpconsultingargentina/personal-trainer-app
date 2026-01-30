'use client'

import { useState } from 'react'
import { updateStudent, type Student } from '@/app/actions/students'
import { type FrequencyPrice } from '@/app/actions/frequencies'
import { useRouter } from 'next/navigation'
import { Edit2, X } from 'lucide-react'

interface EditStudentModalProps {
  student: Student & {
    frequency?: {
      id: string
      frequency_code: string
      classes_per_week: number
      price_per_class: number
      description: string | null
    } | null
  }
  frequencies: FrequencyPrice[]
}

export default function EditStudentModal({ student, frequencies }: EditStudentModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone || '',
    frequency_id: student.frequency_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await updateStudent(student.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        frequency_id: formData.frequency_id || null,
      })
      
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar alumno')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      frequency_id: student.frequency_id || '',
    })
    setError(null)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-border rounded text-sm font-medium text-foreground hover:bg-surface-alt"
      >
        <Edit2 className="h-4 w-4 mr-2" />
        Editar
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Editar Alumno
            </h2>
            <button
              onClick={handleCancel}
              className="text-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {student.auth_user_id && (
                <div className="mt-2 bg-primary/10 border border-primary rounded p-2">
                  <p className="text-xs text-primary font-medium">
                    ⚠️ Este alumno tiene cuenta registrada
                  </p>
                  <p className="text-xs text-primary mt-1">
                    Cambiar el email aquí NO cambiará su email de inicio de sesión. 
                    El alumno deberá actualizar su email desde su perfil en el portal.
                  </p>
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            {/* Frecuencia */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-foreground mb-1">
                Frecuencia
              </label>
              <select
                id="frequency"
                value={formData.frequency_id}
                onChange={(e) => setFormData({ ...formData, frequency_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin frecuencia</option>
                {frequencies
                  .filter(f => f.is_active)
                  .map((freq) => (
                    <option key={freq.id} value={freq.id}>
                      {freq.description} - ${freq.price_per_class.toLocaleString('es-AR')}/clase
                    </option>
                  ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-border rounded text-foreground hover:bg-surface-alt disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-background rounded hover:bg-accent disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
