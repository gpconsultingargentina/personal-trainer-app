'use client'

import { deletePlan } from '@/app/actions/plans'

interface DeletePlanButtonProps {
  planId: string
  planName: string
}

export default function DeletePlanButton({ planId, planName }: DeletePlanButtonProps) {
  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el plan "${planName}"?`)) {
      return
    }

    const formData = new FormData(e.currentTarget)
    await deletePlan(formData)
  }

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="id" value={planId} />
      <button
        type="submit"
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </button>
    </form>
  )
}

