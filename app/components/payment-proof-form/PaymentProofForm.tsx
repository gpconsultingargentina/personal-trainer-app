'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/app/lib/supabase/client'
import CouponInput from '@/app/components/coupon-input/CouponInput'
import PriceDisplay from '@/app/components/price-display/PriceDisplay'
import type { Student } from '@/app/actions/students'
import type { Plan } from '@/app/actions/plans'

interface PaymentProofFormProps {
  students: Student[]
  plans: Plan[]
}

export default function PaymentProofForm({ students, plans }: PaymentProofFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [studentId, setStudentId] = useState('')
  const [planId, setPlanId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [finalPrice, setFinalPrice] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>()
  const [couponCode, setCouponCode] = useState<string>()
  const [couponId, setCouponId] = useState<string | null>(null)

  const selectedPlan = plans.find(p => p.id === planId)
  const originalPrice = selectedPlan?.price || 0

  // Actualizar precio final cuando cambia el plan
  useEffect(() => {
    if (selectedPlan) {
      setFinalPrice(selectedPlan.price)
      setDiscountAmount(undefined)
      setCouponCode(undefined)
      setCouponId(null)
    }
  }, [planId, selectedPlan])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Use JPG, PNG o PDF')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB')
        return
      }

      setFile(file)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!studentId || !planId || !file || !selectedPlan) {
      setError('Por favor completa todos los campos requeridos')
      setLoading(false)
      return
    }

    try {
      // Usar el cupón validado
      const finalCouponId = couponId
      const finalDiscount = discountAmount || 0

      // Subir archivo y crear comprobante en una sola API route usando service client
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('student_id', studentId)
      formDataToSend.append('plan_id', planId)
      formDataToSend.append('original_price', originalPrice.toString())
      formDataToSend.append('final_price', finalPrice.toString())
      formDataToSend.append('discount_applied', finalDiscount.toString())
      if (finalCouponId) {
        formDataToSend.append('coupon_id', finalCouponId)
      }

      const response = await fetch('/api/payments/upload-and-create', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir el comprobante')
      }

      router.push('/dashboard/payments')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
          Alumno *
        </label>
        <select
          id="student_id"
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Selecciona un alumno</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} - {student.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="plan_id" className="block text-sm font-medium text-gray-700">
          Plan de Clases *
        </label>
        <select
          id="plan_id"
          required
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value)
            const plan = plans.find(p => p.id === e.target.value)
            if (plan) {
              setFinalPrice(plan.price)
              setDiscountAmount(undefined)
              setCouponCode(undefined)
              setCouponId(null)
            }
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Selecciona un plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ${plan.price.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {selectedPlan && (
        <>
          <CouponInput
            planPrice={originalPrice}
            planId={selectedPlan.id}
            onCouponValidated={(valid, price, discount, code, coupon) => {
              if (valid && price !== undefined && discount !== undefined) {
                setFinalPrice(price)
                setDiscountAmount(discount)
                setCouponCode(code)
                setCouponId(coupon?.id || null)
              } else {
                setFinalPrice(originalPrice)
                setDiscountAmount(undefined)
                setCouponCode(undefined)
                setCouponId(null)
              }
            }}
          />

          <PriceDisplay
            originalPrice={originalPrice}
            finalPrice={finalPrice}
            discountAmount={discountAmount}
            couponCode={couponCode}
          />
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comprobante de Pago *
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <p className="text-sm text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra y suelta el archivo aquí, o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG o PDF (máximo 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !studentId || !planId || !file}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Subiendo...' : 'Subir Comprobante'}
        </button>
      </div>
    </form>
  )
}

