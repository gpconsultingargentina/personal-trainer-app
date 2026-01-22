import StudentForm from '@/app/components/student-form/StudentForm'

export default function NewStudentPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Alumno</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <StudentForm />
      </div>
    </div>
  )
}

