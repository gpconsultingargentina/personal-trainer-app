import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentForPortal } from '@/app/actions/students'
import Link from 'next/link'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const portalData = await getStudentForPortal(user.id)

  if (!portalData) {
    redirect('/login')
  }

  const { student, credits, upcomingClasses } = portalData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {student.name.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-gray-600">
          Bienvenido/a a tu portal de entrenamiento
        </p>
      </div>

      {/* Resumen de creditos */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Mis Creditos</h2>
          <Link
            href="/portal/creditos"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Ver detalles
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600 font-medium">Disponibles</p>
            <p className="text-3xl font-bold text-indigo-900">{credits.available}</p>
          </div>

          {credits.expiringSoon > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Por vencer (7 dias)</p>
              <p className="text-3xl font-bold text-yellow-900">{credits.expiringSoon}</p>
            </div>
          )}

          {credits.nextExpirationDate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Proximo vencimiento</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatShortDate(credits.nextExpirationDate)}
              </p>
            </div>
          )}
        </div>

        {credits.available === 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              No tienes creditos disponibles.{' '}
              <Link href="/portal/pagos" className="font-medium underline">
                Cargar creditos
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Proximas clases */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Proximas Clases</h2>
          <Link
            href="/portal/clases"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Ver todas
          </Link>
        </div>

        {upcomingClasses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tienes clases programadas
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(classItem.scheduled_at)}
                  </p>
                  <p className="text-sm text-gray-500">Clase confirmada</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmada
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones rapidas */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/portal/pagos"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-2 font-medium text-gray-900">Cargar Creditos</p>
            <p className="text-sm text-gray-500">Subir comprobante</p>
          </div>
        </Link>

        <Link
          href="/portal/clases"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 font-medium text-gray-900">Mis Clases</p>
            <p className="text-sm text-gray-500">Ver historial</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
