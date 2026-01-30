import Link from 'next/link'
import { getStudents } from '@/app/actions/students'
import StudentsList from '@/app/components/students-list/StudentsList'

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Alumnos</h1>
        <Link
          href="/dashboard/students/new"
          className="px-4 py-2 bg-primary text-background rounded hover:bg-accent"
        >
          Agregar Alumno
        </Link>
      </div>

      <StudentsList students={students} />
    </div>
  )
}
