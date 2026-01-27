import Link from 'next/link'
import { getClasses } from '@/app/actions/classes'
import ClassesList from '@/app/components/classes-list/ClassesList'

export default async function ClassesPage() {
  const classes = await getClasses()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Clases</h1>
        <Link
          href="/dashboard/classes/new"
          className="px-4 py-2 bg-primary text-background rounded hover:bg-accent"
        >
          Nueva Clase
        </Link>
      </div>

      <ClassesList classes={classes} />
    </div>
  )
}
