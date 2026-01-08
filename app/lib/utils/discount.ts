export function calculateDiscount(
  originalPrice: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): { finalPrice: number; discountAmount: number } {
  let discountAmount = 0
  let finalPrice = originalPrice

  if (discountType === 'percentage') {
    discountAmount = (originalPrice * discountValue) / 100
    finalPrice = originalPrice - discountAmount
  } else {
    discountAmount = discountValue
    finalPrice = originalPrice - discountAmount
  }

  // Asegurar que el precio final no sea negativo
  finalPrice = Math.max(0, finalPrice)

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
  }
}

