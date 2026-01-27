import ClassForm from '@/app/components/class-form/ClassForm'

export default function NewClassPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Nueva Clase</h1>
      <div className="bg-surface shadow rounded p-6">
        <ClassForm />
      </div>
    </div>
  )
}

