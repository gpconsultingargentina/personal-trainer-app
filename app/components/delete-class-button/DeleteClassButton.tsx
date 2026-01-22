'use client'

import { deleteClass } from '@/app/actions/classes'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteClassButtonProps {
  classId: string
  scheduledAt: string
}

export default function DeleteClassButton({ classId, scheduledAt }: DeleteClassButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const date = new Date(scheduledAt).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la clase del ${date}?`)) {
      return
    }

    setLoading(true)
    try {
      await deleteClass(classId)
      router.refresh()
    } catch (error) {
      alert('Error al eliminar la clase: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}

