import Link from 'next/link'
import { getStudents } from '@/app/actions/students'

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

      <div className="bg-surface shadow overflow-hidden rounded">
        <ul className="divide-y divide-border">
          {students.length === 0 ? (
            <li className="px-6 py-4 text-center text-muted">
              No hay alumnos registrados
            </li>
          ) : (
            students.map((student) => (
              <li key={student.id}>
                <Link href={`/dashboard/students/${student.id}`}>
                  <div className="px-6 py-4 hover:bg-surface-alt cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-foreground">
                              {student.name}
                            </h3>
                            {student.auth_user_id ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                                Registrado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                Pendiente
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted">{student.email}</p>
                          {student.phone && (
                            <p className="mt-1 text-sm text-muted">{student.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted">
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
