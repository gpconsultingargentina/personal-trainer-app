import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentByAuthUserId } from '@/app/actions/students'
import PortalNav from '@/app/components/portal-nav/PortalNav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que es un student
  if (user.user_metadata?.role !== 'student') {
    redirect('/dashboard')
  }

  // Obtener datos del estudiante
  const student = await getStudentByAuthUserId(user.id)

  if (!student) {
    // Si no hay estudiante vinculado, algo está mal
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav studentName={student.name} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
