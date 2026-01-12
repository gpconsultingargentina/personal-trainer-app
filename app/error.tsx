'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Algo salió mal</h2>
        <p className="text-gray-600">{error?.message || 'Ocurrió un error inesperado'}</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          }}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Ir al Login
        </button>
      </div>
    </div>
  )
}
