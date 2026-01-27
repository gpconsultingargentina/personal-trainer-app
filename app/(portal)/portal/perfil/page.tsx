import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentByAuthUserId } from '@/app/actions/students'
import ChangePasswordButton from './ChangePasswordButton'

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const student = await getStudentByAuthUserId(user.id)

  if (!student) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="mt-1 text-muted">Informacion de tu cuenta</p>
      </div>

      {/* Datos personales */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Datos Personales</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted">Nombre</label>
            <p className="mt-1 text-foreground">{student.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted">Email</label>
            <p className="mt-1 text-foreground">{student.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted">Telefono</label>
            <p className="mt-1 text-foreground">{student.phone || 'No registrado'}</p>
          </div>
        </div>
      </div>

      {/* Informacion de entrenamiento */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Entrenamiento</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted">Frecuencia</label>
            <p className="mt-1 text-foreground">
              {student.frequency ? (
                <>
                  {student.frequency.description} ({student.frequency.classes_per_week} clase{student.frequency.classes_per_week > 1 ? 's' : ''}/semana)
                </>
              ) : (
                'No asignada'
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted">Precio por clase</label>
            <p className="mt-1 text-foreground">
              {student.frequency ? formatCurrency(student.frequency.price_per_class) : 'No definido'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted">Horario habitual</label>
            {student.usual_schedule && student.usual_schedule.length > 0 ? (
              <div className="mt-1 space-y-1">
                {student.usual_schedule.map((schedule, index) => (
                  <p key={index} className="text-foreground">
                    {dayNames[schedule.dayOfWeek]} a las {schedule.time}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-muted">No definido</p>
            )}
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Seguridad</h2>
        </div>

        <div className="px-6 py-4">
          <ChangePasswordButton />
        </div>
      </div>

      {/* Nota sobre cambios */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-800">
            Para modificar tus datos personales o frecuencia de entrenamiento, contacta a tu entrenador.
          </p>
        </div>
      </div>
    </div>
  )
}
