import Link from 'next/link'
import { getStudents } from '@/app/actions/students'

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alumnos</h1>
        <Link
          href="/dashboard/students/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Agregar Alumno
        </Link>
      </div>

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
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {student.name}
                            </h3>
                            {student.auth_user_id ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Registrado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{student.email}</p>
                          {student.phone && (
                            <p className="mt-1 text-sm text-gray-500">{student.phone}</p>
                          )}
                        </div>
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

