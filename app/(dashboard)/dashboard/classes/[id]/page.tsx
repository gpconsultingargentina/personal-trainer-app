import { getClass } from '@/app/actions/classes'
import ClassForm from '@/app/components/class-form/ClassForm'
import { notFound } from 'next/navigation'

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const classData = await getClass(id)

  if (!classData) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Editar Clase</h1>
      <div className="bg-surface shadow rounded p-6">
        <ClassForm classData={classData} />
      </div>
    </div>
  )
}

