'use client'

import { deleteStudent } from '@/app/actions/students'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteStudentButtonProps {
  studentId: string
  studentName: string
}

export default function DeleteStudentButton({ studentId, studentName }: DeleteStudentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${studentName}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    setLoading(true)
    try {
      await deleteStudent(studentId)
      router.push('/dashboard/students')
      router.refresh()
    } catch (error) {
      alert('Error al eliminar el alumno: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 bg-error text-white rounded hover:bg-error/80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Eliminando...' : 'Eliminar Alumno'}
    </button>
  )
}

