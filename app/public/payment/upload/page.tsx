'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getActivePlans, type Plan } from '@/app/actions/plans'
import { createOrGetStudent, getStudent } from '@/app/actions/students'
import { createClient } from '@/app/lib/supabase/client'
import PaymentProofUpload from '@/app/components/payment-proof-upload/PaymentProofUpload'
import { validateCoupon } from '@/app/actions/coupons'
import { calculateDiscount } from '@/app/lib/utils/discount'
import { createPaymentProof } from '@/app/actions/payments'

function PaymentUploadContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('planId')
  const studentId = searchParams.get('studentId')
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadPlans() {
      const activePlans = await getActivePlans()
      setPlans(activePlans)

      if (planId) {
        const plan = activePlans.find(p => p.id === planId)
        if (plan) {
          setSelectedPlan(plan)
        }
      }

      setLoading(false)
    }
    loadPlans()
  }, [planId])

  const handleSubmit = async (
    fileUrl: string,
    finalPrice: number,
    couponCode?: string
  ) => {
    if (!selectedPlan) return

    setSubmitting(true)

    try {
      let student

      // Si hay studentId, usar ese estudiante, sino pedir datos
      if (studentId) {
        const foundStudent = await getStudent(studentId)
        if (!foundStudent) {
          throw new Error('Estudiante no encontrado')
        }
        student = foundStudent
      } else {
        // Obtener datos del estudiante (esto debería venir de un formulario)
        const studentName = prompt('Ingresa tu nombre:')
        const studentEmail = prompt('Ingresa tu email:')
        const studentPhone = prompt('Ingresa tu teléfono (opcional):') || undefined

        if (!studentName || !studentEmail) {
          throw new Error('Nombre y email son requeridos')
        }

        // Crear o obtener estudiante
        student = await createOrGetStudent(
          studentName,
          studentEmail,
          studentPhone
        )
      }

      // Obtener cupón si hay
      let couponId: string | undefined
      let discountApplied = 0
      if (couponCode) {
        const couponResult = await validateCoupon(couponCode, selectedPlan.id)
        if (couponResult.valid && couponResult.coupon) {
          couponId = couponResult.coupon.id
          const discount = calculateDiscount(
            selectedPlan.price,
            couponResult.coupon.discount_type,
            couponResult.coupon.discount_value
          )
          discountApplied = discount.discountAmount
        }
      }

      // Crear registro de comprobante usando acción del servidor
      await createPaymentProof({
        student_id: student.id,
        plan_id: selectedPlan.id,
        coupon_id: couponId || null,
        original_price: selectedPlan.price,
        final_price: finalPrice,
        discount_applied: discountApplied,
        file_url: fileUrl,
      })

      // Registrar uso de cupón si aplica
      if (couponId) {
        // Esto se hace después de crear el payment_proof
        // Necesitaríamos obtener el ID del payment_proof recién creado
      }

      alert('Comprobante subido exitosamente. Serás notificado cuando sea aprobado.')
      if (studentId) {
        router.push(`/dashboard/students/${studentId}`)
      } else {
        router.push('/public/book')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al subir el comprobante')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!selectedPlan && plans.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Selecciona un Plan</h1>
          <div className="space-y-4">
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="w-full text-left bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold text-indigo-600 mt-2">
                  ${plan.price.toFixed(2)}
                </p>
                {plan.description && (
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedPlan) {
    return <div className="min-h-screen flex items-center justify-center">No hay planes disponibles</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Subir Comprobante de Pago</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <PaymentProofUpload
            planId={selectedPlan.id}
            planPrice={selectedPlan.price}
            planName={selectedPlan.name}
            cbuIban={selectedPlan.cbu_iban}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

export default function PaymentUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PaymentUploadContent />
    </Suspense>
  )
}

