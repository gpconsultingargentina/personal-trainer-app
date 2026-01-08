'use client'

interface PriceDisplayProps {
  originalPrice: number
  finalPrice?: number
  discountAmount?: number
  couponCode?: string
}

export default function PriceDisplay({
  originalPrice,
  finalPrice,
  discountAmount,
  couponCode,
}: PriceDisplayProps) {
  const displayPrice = finalPrice !== undefined ? finalPrice : originalPrice
  const hasDiscount = discountAmount !== undefined && discountAmount > 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline space-x-2">
        {hasDiscount && (
          <span className="text-lg text-gray-400 line-through">
            ${originalPrice.toFixed(2)}
          </span>
        )}
        <span className={`text-2xl font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-900'}`}>
          ${displayPrice.toFixed(2)}
        </span>
      </div>
      {hasDiscount && discountAmount && (
        <div className="text-sm text-green-600">
          Ahorras ${discountAmount.toFixed(2)}
          {couponCode && ` con cupón ${couponCode}`}
        </div>
      )}
    </div>
  )
}

