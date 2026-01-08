import CouponForm from '@/app/components/coupon-form/CouponForm'

export default function NewCouponPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Cupón</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CouponForm />
      </div>
    </div>
  )
}

