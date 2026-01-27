'use client'

import { deleteCoupon } from '@/app/actions/coupons'

interface DeleteCouponButtonProps {
  couponId: string
  couponCode: string
}

export default function DeleteCouponButton({ couponId, couponCode }: DeleteCouponButtonProps) {
  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!confirm(`¿Estás seguro de que quieres eliminar el cupón "${couponCode}"?`)) {
      return
    }

    await deleteCoupon(couponId)
  }

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="id" value={couponId} />
      <button
        type="submit"
        className="text-red-600 hover:text-red-900"
      >
        Eliminar
      </button>
    </form>
  )
}

