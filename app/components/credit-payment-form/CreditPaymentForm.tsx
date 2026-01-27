'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import CouponInput from '@/app/components/coupon-input/CouponInput'
import PriceDisplay from '@/app/components/price-display/PriceDisplay'

// Tipo minimo requerido de frecuencia (compatible con StudentWithFrequency.frequency)
interface FrequencyInfo {
  id: string
  frequency_code: string
  classes_per_week: number
  price_per_class: number
  description: string | null
}

interface CreditPaymentFormProps {
  studentId: string
  studentName: string
  frequency: FrequencyInfo | null
  currentCredits: number
}

export default function CreditPaymentForm({
  studentId,
  studentName,
  frequency,
  currentCredits,
}: CreditPaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [classesCount, setClassesCount] = useState<number>(12)
  const [file, setFile] = useState<File | null>(null)
  const [discountAmount, setDiscountAmount] = useState<number>()
  const [couponCode, setCouponCode] = useState<string>()
  const [couponId, setCouponId] = useState<string | null>(null)

  const pricePerClass = frequency?.price_per_class || 0
  const originalPrice = classesCount * pricePerClass
  const finalPrice = discountAmount !== undefined ? originalPrice - discountAmount : originalPrice

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0]

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(droppedFile.type)) {
        setError('Tipo de archivo no permitido. Use JPG, PNG o PDF')
        return
      }

      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Maximo 5MB')
        return
      }

      setFile(droppedFile)
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

    if (!file || !frequency || classesCount < 1) {
      setError('Por favor completa todos los campos requeridos')
      setLoading(false)
      return
    }

    try {
      const finalDiscount = discountAmount || 0

      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('student_id', studentId)
      formDataToSend.append('original_price', originalPrice.toString())
      formDataToSend.append('final_price', finalPrice.toString())
      formDataToSend.append('discount_applied', finalDiscount.toString())
      // Nuevos campos para creditos
      formDataToSend.append('classes_purchased', classesCount.toString())
      formDataToSend.append('price_per_class', pricePerClass.toString())
      formDataToSend.append('frequency_code', frequency.frequency_code)
      if (couponId) {
        formDataToSend.append('coupon_id', couponId)
      }

      const response = await fetch('/api/payments/upload-and-create', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir el comprobante')
      }

      router.push(`/dashboard/students/${studentId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante')
      setLoading(false)
    }
  }

  if (!frequency) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          Este alumno no tiene una frecuencia asignada. Por favor, asigna una frecuencia antes de registrar un pago.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          Comprobante para <strong>{studentName}</strong>
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Frecuencia: {frequency.description} | Creditos actuales: {currentCredits}
        </p>
      </div>

      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm font-medium text-indigo-900 mb-2">
          Precio por clase: ${pricePerClass.toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-indigo-700">
          Basado en frecuencia {frequency.frequency_code} ({frequency.description})
        </p>
      </div>

      <div>
        <label htmlFor="classes_count" className="block text-sm font-medium text-gray-700">
          Cantidad de Clases a Comprar *
        </label>
        <input
          type="number"
          id="classes_count"
          min={1}
          max={100}
          value={classesCount}
          onChange={(e) => {
            setClassesCount(parseInt(e.target.value) || 1)
            // Reset cupón al cambiar cantidad
            setDiscountAmount(undefined)
            setCouponCode(undefined)
            setCouponId(null)
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Los creditos vencen a los 60 dias de la compra
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[4, 8, 12].map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => {
              setClassesCount(count)
              setDiscountAmount(undefined)
              setCouponCode(undefined)
              setCouponId(null)
            }}
            className={`px-3 py-2 text-sm rounded-md border ${
              classesCount === count
                ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {count} clases
          </button>
        ))}
      </div>

      <CouponInput
        planPrice={originalPrice}
        onCouponValidated={(valid, price, discount, code, coupon) => {
          if (valid && price !== undefined && discount !== undefined) {
            setDiscountAmount(discount)
            setCouponCode(code)
            setCouponId(coupon?.id || null)
          } else {
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
                  ? 'Suelta el archivo aqui'
                  : 'Arrastra y suelta el archivo aqui, o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG o PDF (maximo 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || classesCount < 1 || !file}
          className="px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Subiendo...' : `Subir Comprobante ($${finalPrice.toLocaleString('es-AR')})`}
        </button>
      </div>
    </form>
  )
}
