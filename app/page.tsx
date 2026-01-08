import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si está autenticado, redirigir al dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Personal Trainer App
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de gestión de clases y reservas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card para Reservar Clases */}
          <Link
            href="/public/book"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="h-16 w-16 mx-auto text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Reservar Clase
              </h2>
              <p className="text-gray-600">
                Consulta las clases disponibles y reserva tu lugar
              </p>
            </div>
          </Link>

          {/* Card para Login del Entrenador */}
          <Link
            href="/login"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="h-16 w-16 mx-auto text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Área del Entrenador
              </h2>
              <p className="text-gray-600">
                Accede al panel de administración y gestión
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            ¿Necesitas ayuda? Contacta con tu entrenador personal
          </p>
        </div>
      </div>
    </div>
  )
}

