import { getStudent } from '@/app/actions/students'
import { notFound } from 'next/navigation'
import StudentClassForm from '@/app/components/student-class-form/StudentClassForm'

export default async function NewStudentClassPage({
  params,
}: {
  params: { id: string }
}) {
  const student = await getStudent(params.id)

  if (!student) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Nueva Clase para {student.name}
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <StudentClassForm studentId={student.id} studentName={student.name} />
      </div>
    </div>
  )
}

