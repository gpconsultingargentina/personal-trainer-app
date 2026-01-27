import StudentForm from '@/app/components/student-form/StudentForm'
import { getActiveFrequencies } from '@/app/actions/frequencies'

export default async function NewStudentPage() {
  let frequencies: Awaited<ReturnType<typeof getActiveFrequencies>> = []
  try {
    frequencies = await getActiveFrequencies()
  } catch {
    // Si falla, probablemente la tabla no existe todavia
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Alumno</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <StudentForm frequencies={frequencies} />
      </div>
    </div>
  )
}

