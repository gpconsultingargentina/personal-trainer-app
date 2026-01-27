'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  action: () => Promise<void>
  label?: string
  confirmMessage: string
}

export default function DeleteButton({
  action,
  label = 'Eliminar',
  confirmMessage,
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (confirm(confirmMessage)) {
      startTransition(async () => {
        try {
          await action()
          router.refresh()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar'
          alert(`Error: ${errorMessage}`)
        }
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-error hover:text-error/80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Eliminando...' : label}
    </button>
  )
}
