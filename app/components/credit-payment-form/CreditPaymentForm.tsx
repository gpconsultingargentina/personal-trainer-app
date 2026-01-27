'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

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

  const pricePerClass = frequency?.price_per_class || 0
  const totalPrice = classesCount * pricePerClass

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
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('student_id', studentId)
      formDataToSend.append('original_price', totalPrice.toString())
      formDataToSend.append('final_price', totalPrice.toString())
      formDataToSend.append('discount_applied', '0')
      // Campos para creditos
      formDataToSend.append('classes_purchased', classesCount.toString())
      formDataToSend.append('price_per_class', pricePerClass.toString())
      formDataToSend.append('frequency_code', frequency.frequency_code)

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
      <div className="bg-primary/10 border border-primary rounded p-4">
        <p className="text-sm text-primary">
          Este alumno no tiene una frecuencia asignada. Por favor, asigna una frecuencia antes de registrar un pago.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-primary/10 border border-primary rounded p-4">
        <p className="text-sm text-primary">
          Comprobante para <strong>{studentName}</strong>
        </p>
        <p className="text-sm text-primary mt-1">
          Frecuencia: {frequency.description} | Creditos actuales: {currentCredits}
        </p>
      </div>

      <div className="bg-primary/10 rounded p-4">
        <p className="text-sm font-medium text-foreground mb-2">
          Precio por clase: ${pricePerClass.toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-primary">
          Basado en frecuencia {frequency.frequency_code} ({frequency.description})
        </p>
      </div>

      <div>
        <label htmlFor="classes_count" className="block text-sm font-medium text-muted">
          Cantidad de Clases a Comprar *
        </label>
        <input
          type="number"
          id="classes_count"
          min={1}
          max={100}
          value={classesCount}
          onChange={(e) => setClassesCount(parseInt(e.target.value) || 1)}
          className="mt-1 block w-full rounded border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
        <p className="mt-1 text-sm text-muted">
          Los creditos vencen a los 60 dias de la compra
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[4, 8, 12].map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => setClassesCount(count)}
            className={`px-3 py-2 text-sm rounded border ${
              classesCount === count
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface border-border text-muted hover:bg-surface-alt'
            }`}
          >
            {count} clases
          </button>
        ))}
      </div>

      <div className="bg-background rounded p-4">
        <p className="text-sm text-muted">Total a pagar:</p>
        <p className="text-2xl font-bold text-foreground">
          ${totalPrice.toLocaleString('es-AR')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Comprobante de Pago *
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-muted'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <p className="text-sm text-muted">{file.name}</p>
              <p className="text-xs text-muted mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted">
                {isDragActive
                  ? 'Suelta el archivo aqui'
                  : 'Arrastra y suelta el archivo aqui, o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-muted mt-1">
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
          className="px-4 py-3 border border-border rounded shadow-sm text-sm font-medium text-muted bg-surface hover:bg-surface-alt"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || classesCount < 1 || !file}
          className="px-4 py-3 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Subiendo...' : `Subir Comprobante ($${totalPrice.toLocaleString('es-AR')})`}
        </button>
      </div>
    </form>
  )
}
