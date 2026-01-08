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
        await action()
        router.refresh()
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Eliminando...' : label}
    </button>
  )
}
