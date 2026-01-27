'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

type StudentPaymentFormProps = {
  studentId: string
  pricePerClass: number
  frequencyCode: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export default function StudentPaymentForm({
  studentId,
  pricePerClass,
  frequencyCode,
}: StudentPaymentFormProps) {
  const router = useRouter()
  const [classesCount, setClassesCount] = useState(4)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const totalAmount = classesCount * pricePerClass

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Debes subir un comprobante de pago')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Subir archivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', studentId)

      const uploadResponse = await fetch('/api/payment-proof/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json()
        throw new Error(uploadError.error || 'Error al subir el archivo')
      }

      const { fileUrl } = await uploadResponse.json()

      // Crear payment proof
      const createResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          file_url: fileUrl,
          original_price: totalAmount,
          final_price: totalAmount,
          discount_applied: 0,
          classes_purchased: classesCount,
          price_per_class: pricePerClass,
          frequency_code: frequencyCode,
        }),
      })

      if (!createResponse.ok) {
        const createError = await createResponse.json()
        throw new Error(createError.error || 'Error al registrar el pago')
      }

      setSuccess(true)
      setFile(null)
      setClassesCount(4)

      // Recargar para ver el nuevo pago en el historial
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-success/10 border border-success/20 rounded p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10">
          <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-success">Comprobante Enviado</h3>
        <p className="mt-2 text-success">
          Tu comprobante fue enviado y esta pendiente de aprobacion.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-success hover:text-success/80 underline"
        >
          Enviar otro comprobante
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Cantidad de clases */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Cantidad de clases a comprar
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setClassesCount(Math.max(1, classesCount - 1))}
            className="p-2 border border-border rounded hover:bg-surface-alt"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min="1"
            max="50"
            value={classesCount}
            onChange={(e) => setClassesCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center text-xl font-bold border border-border rounded py-2"
          />
          <button
            type="button"
            onClick={() => setClassesCount(Math.min(50, classesCount + 1))}
            className="p-2 border border-border rounded hover:bg-surface-alt"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Resumen de precio */}
      <div className="bg-background rounded p-4">
        <div className="flex justify-between text-sm text-muted">
          <span>Precio por clase:</span>
          <span>{formatCurrency(pricePerClass)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted mt-1">
          <span>Cantidad:</span>
          <span>{classesCount} clases</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-foreground mt-2 pt-2 border-t border-border">
          <span>Total:</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Upload de comprobante */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Comprobante de pago
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : file
              ? 'border-success bg-success/10'
              : 'border-border hover:border-border/80'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <svg className="mx-auto h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-success">{file.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                className="mt-2 text-xs text-error hover:text-error/80"
              >
                Eliminar
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-muted">
                {isDragActive ? 'Suelta el archivo aqui' : 'Arrastra o haz clic para subir'}
              </p>
              <p className="text-xs text-muted mt-1">PNG, JPG, PDF hasta 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Boton enviar */}
      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Enviando...' : 'Enviar Comprobante'}
      </button>
    </form>
  )
}
