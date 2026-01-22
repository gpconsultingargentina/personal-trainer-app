'use client'

import { useState, useEffect, useCallback } from 'react'
import { calculateDiscount } from '@/app/lib/utils/discount'

interface CouponInputProps {
  planPrice: number
  planId?: string
  onCouponValidated?: (valid: boolean, finalPrice?: number, discountAmount?: number, code?: string, coupon?: any) => void
}

export default function CouponInput({
  planPrice,
  planId,
  onCouponValidated,
}: CouponInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<any>(null)

  const validateCoupon = useCallback(
    async (couponCode: string) => {
      if (!couponCode.trim()) {
        setError(null)
        setCoupon(null)
        onCouponValidated?.(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: couponCode.toUpperCase(),
            planId,
          }),
        })

        const result = await response.json()

        if (result.valid && result.coupon) {
          setCoupon(result.coupon)
          setError(null)

          const { finalPrice, discountAmount } = calculateDiscount(
            planPrice,
            result.coupon.discount_type,
            result.coupon.discount_value
          )

          onCouponValidated?.(true, finalPrice, discountAmount, code.toUpperCase(), result.coupon)
        } else {
          setCoupon(null)
          setError(result.error || 'Cupón inválido')
          onCouponValidated?.(false)
        }
      } catch (err) {
        setCoupon(null)
        setError('Error al validar el cupón')
        onCouponValidated?.(false)
      } finally {
        setLoading(false)
      }
    },
    [planPrice, planId, onCouponValidated]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) {
        validateCoupon(code)
      } else {
        setError(null)
        setCoupon(null)
        onCouponValidated?.(false)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timer)
  }, [code, validateCoupon, onCouponValidated])

  return (
    <div className="space-y-2">
      <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">
        Código de Cupón (opcional)
      </label>
      <input
        type="text"
        id="coupon"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Ingresa el código"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
      />
      {loading && (
        <p className="text-sm text-gray-500">Validando cupón...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {coupon && !error && (
        <p className="text-sm text-green-600">
          ✓ Cupón válido: {coupon.discount_type === 'percentage'
            ? `${coupon.discount_value}% de descuento`
            : `$${coupon.discount_value.toFixed(2)} de descuento`}
        </p>
      )}
    </div>
  )
}

