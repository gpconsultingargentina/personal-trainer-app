import { getStudent } from '@/app/actions/students'
import { notFound } from 'next/navigation'
import StudentClassForm from '@/app/components/student-class-form/StudentClassForm'

export default async function NewStudentClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudent(id)

  if (!student) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Nueva Clase para {student.name}
      </h1>
      <div className="bg-surface shadow rounded p-6">
        <StudentClassForm studentId={student.id} studentName={student.name} />
      </div>
    </div>
  )
}

