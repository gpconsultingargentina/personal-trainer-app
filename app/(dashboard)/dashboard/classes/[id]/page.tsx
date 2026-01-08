import { getClass } from '@/app/actions/classes'
import ClassForm from '@/app/components/class-form/ClassForm'
import { notFound } from 'next/navigation'

export default async function EditClassPage({
  params,
}: {
  params: { id: string }
}) {
  const classData = await getClass(params.id)

  if (!classData) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Clase</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <ClassForm classData={classData} />
      </div>
    </div>
  )
}

