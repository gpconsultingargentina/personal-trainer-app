import { getCoupon } from '@/app/actions/coupons'
import CouponForm from '@/app/components/coupon-form/CouponForm'
import { notFound } from 'next/navigation'

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const coupon = await getCoupon(id)

  if (!coupon) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Cupón</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CouponForm coupon={coupon} />
      </div>
    </div>
  )
}

