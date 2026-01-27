'use client'

import { useState } from 'react'
import { createRegistrationToken } from '@/app/actions/registration'

type InviteStudentButtonProps = {
  studentId: string
  isRegistered: boolean
}

export default function InviteStudentButton({
  studentId,
  isRegistered,
}: InviteStudentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createRegistrationToken(studentId)
      setLink(result.link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar invitacion')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isRegistered) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
        <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Registrado
      </span>
    )
  }

  if (link) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            readOnly
            value={link}
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 truncate"
          />
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            copied
              ? 'bg-green-100 text-green-800'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button
          onClick={() => setLink(null)}
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleGenerateLink}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Generar Invitacion
          </>
        )}
      </button>
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  )
}
