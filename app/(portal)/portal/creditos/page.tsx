import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentByAuthUserId } from '@/app/actions/students'
import { getStudentCreditSummary, getCreditTransactions } from '@/app/actions/credits'
import Link from 'next/link'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const transactionTypeLabels: Record<string, string> = {
  purchase: 'Compra',
  attendance: 'Asistencia',
  adjustment: 'Ajuste',
  expiration: 'Vencimiento',
}

const transactionTypeColors: Record<string, string> = {
  purchase: 'bg-success/10 text-success',
  attendance: 'bg-blue-100 text-blue-800',
  adjustment: 'bg-yellow-100 text-yellow-800',
  expiration: 'bg-error/10 text-error',
}

export default async function CreditosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const student = await getStudentByAuthUserId(user.id)

  if (!student) {
    redirect('/login')
  }

  const [summary, transactions] = await Promise.all([
    getStudentCreditSummary(student.id),
    getCreditTransactions(student.id, 50),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Creditos</h1>
          <p className="mt-1 text-muted">Saldo y movimientos</p>
        </div>
        <Link
          href="/portal/pagos"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent"
        >
          Cargar Creditos
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Disponibles</p>
          <p className="text-2xl font-bold text-primary">{summary.available}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Por vencer (7d)</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.expiringSoon}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Total comprados</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalPurchased}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Total usados</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalUsed}</p>
        </div>
      </div>

      {/* Proximo vencimiento */}
      {summary.nextExpirationDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800">
              Proximo vencimiento: <strong>{formatDate(summary.nextExpirationDate)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Historial de movimientos */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Historial de Movimientos</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transactionTypeColors[transaction.transaction_type]}`}>
                    {transactionTypeLabels[transaction.transaction_type]}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">{transaction.notes || '-'}</p>
                    <p className="text-xs text-muted">{formatDateTime(transaction.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-medium ${transaction.amount > 0 ? 'text-success' : 'text-error'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </p>
                  <p className="text-xs text-muted">Saldo: {transaction.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
