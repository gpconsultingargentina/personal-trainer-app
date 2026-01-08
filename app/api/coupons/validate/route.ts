import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/app/actions/coupons'

export async function POST(request: NextRequest) {
  try {
    const { code, planId } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código de cupón requerido' },
        { status: 400 }
      )
    }

    const result = await validateCoupon(code, planId)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al validar el cupón' },
      { status: 500 }
    )
  }
}

