'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface PaymentProofUploadProps {
  planId: string
  planPrice: number
  planName: string
  cbuIban: string
  onSubmit: (fileUrl: string, finalPrice: number) => Promise<void>
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

      await onSubmit(url, planPrice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">{planName}</h3>
        <p className="text-sm text-muted mb-4">
          CBU/IBAN: <span className="font-mono">{cbuIban}</span>
        </p>
      </div>

      <div className="bg-background rounded p-4">
        <p className="text-sm text-muted">Total a pagar:</p>
        <p className="text-2xl font-bold text-foreground">
          ${planPrice.toFixed(2)}
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
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra y suelta el archivo aquí, o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-muted mt-1">
                JPG, PNG o PDF (máximo 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Subiendo...' : 'Subir Comprobante'}
      </button>
    </form>
  )
}
