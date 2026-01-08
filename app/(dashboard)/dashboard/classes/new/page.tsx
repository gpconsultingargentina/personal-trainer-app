import ClassForm from '@/app/components/class-form/ClassForm'

export default function NewClassPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nueva Clase</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <ClassForm />
      </div>
    </div>
  )
}

