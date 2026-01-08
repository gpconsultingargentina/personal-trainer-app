import Link from 'next/link'
import { getStudents } from '@/app/actions/students'

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Alumnos</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {students.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay alumnos registrados
            </li>
          ) : (
            students.map((student) => (
              <li key={student.id}>
                <Link href={`/dashboard/students/${student.id}`}>
                  <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{student.email}</p>
                        {student.phone && (
                          <p className="mt-1 text-sm text-gray-500">{student.phone}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

