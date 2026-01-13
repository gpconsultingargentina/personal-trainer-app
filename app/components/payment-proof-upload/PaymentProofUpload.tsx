'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import CouponInput from '@/app/components/coupon-input/CouponInput'
import PriceDisplay from '@/app/components/price-display/PriceDisplay'

interface PaymentProofUploadProps {
  planId: string
  planPrice: number
  planName: string
  cbuIban: string
  onSubmit: (fileUrl: string, finalPrice: number, couponId?: string) => Promise<void>
}

export default function PaymentProofUpload({
  planId,
  planPrice,
  planName,
  cbuIban,
  onSubmit,
}: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalPrice, setFinalPrice] = useState(planPrice)
  const [discountAmount, setDiscountAmount] = useState<number>()
  const [couponCode, setCouponCode] = useState<string>()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Use JPG, PNG o PDF')
        return
      }

      // Validar tamaño (5MB)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Subir archivo usando API route
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/payment-proof/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir el archivo')
      }

      const { url } = await response.json()
      
      await onSubmit(url, finalPrice, couponCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">{planName}</h3>
        <p className="text-sm text-gray-600 mb-4">
          CBU/IBAN: <span className="font-mono">{cbuIban}</span>
        </p>
      </div>

      <CouponInput
        planPrice={planPrice}
        planId={planId}
        onCouponValidated={(valid, price, discount) => {
          if (valid && price !== undefined) {
            setFinalPrice(price)
            setDiscountAmount(discount)
          } else {
            setFinalPrice(planPrice)
            setDiscountAmount(undefined)
          }
        }}
      />

      <PriceDisplay
        originalPrice={planPrice}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Subiendo...' : 'Subir Comprobante'}
      </button>
    </form>
  )
}

