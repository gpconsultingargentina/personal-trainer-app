'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="bg-background">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full space-y-4 p-8 bg-surface rounded shadow-md text-center">
            <h2 className="text-2xl font-bold text-foreground">Error crítico</h2>
            <p className="text-muted">{error.message || 'Ocurrió un error crítico'}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
