'use client'

import { useState } from 'react'
import type { StudentCreditSummary as CreditSummaryType } from '@/app/actions/credits'
import type { CreditTransaction } from '@/app/actions/credits'

interface StudentCreditSummaryProps {
  summary: CreditSummaryType
  transactions: CreditTransaction[]
  onAdjustCredits?: (amount: number, notes: string) => Promise<void>
}

export default function StudentCreditSummary({
  summary,
  transactions,
  onAdjustCredits,
}: StudentCreditSummaryProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)

  const handleAdjust = async () => {
    if (!onAdjustCredits || adjustAmount === 0) return

    setAdjusting(true)
    try {
      await onAdjustCredits(adjustAmount, adjustNotes)
      setShowAdjustModal(false)
      setAdjustAmount(0)
      setAdjustNotes('')
    } finally {
      setAdjusting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionIcon = (type: CreditTransaction['transaction_type']) => {
    switch (type) {
      case 'purchase':
        return '+'
      case 'attendance':
        return '-'
      case 'adjustment':
        return '~'
      case 'expiration':
        return '!'
      default:
        return '?'
    }
  }

  const getTransactionColor = (type: CreditTransaction['transaction_type']) => {
    switch (type) {
      case 'purchase':
        return 'text-success'
      case 'attendance':
        return 'text-primary'
      case 'adjustment':
        return 'text-primary'
      case 'expiration':
        return 'text-error'
      default:
        return 'text-muted'
    }
  }

  return (
    <div className="bg-surface shadow rounded p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">Saldo de Creditos</h2>
        {onAdjustCredits && (
          <button
            onClick={() => setShowAdjustModal(true)}
            className="text-sm px-3 py-1 bg-background hover:bg-surface-alt rounded"
          >
            Ajustar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-primary/10 rounded p-4 text-center">
          <p className="text-3xl font-bold text-primary">
            {summary.available}
          </p>
          <p className="text-sm text-muted">Creditos Disponibles</p>
        </div>

        <div className="bg-background rounded p-4 text-center">
          <p className="text-xl font-semibold text-muted">
            {summary.totalUsed} / {summary.totalPurchased}
          </p>
          <p className="text-sm text-muted">Usados / Comprados</p>
        </div>
      </div>

      {summary.expiringSoon > 0 && summary.nextExpirationDate && (
        <div className="bg-primary/10 border border-primary rounded p-3 mb-4">
          <p className="text-sm text-primary">
            <span className="font-semibold">{summary.expiringSoon}</span>{' '}
            {summary.expiringSoon === 1 ? 'credito vence' : 'creditos vencen'}{' '}
            antes del {formatDate(summary.nextExpirationDate)}
          </p>
        </div>
      )}

      {summary.nextExpirationDate && (
        <p className="text-sm text-muted mb-4">
          Proximo vencimiento: {formatDate(summary.nextExpirationDate)}
        </p>
      )}

      <button
        onClick={() => setShowTransactions(!showTransactions)}
        className="text-sm text-primary hover:text-accent"
      >
        {showTransactions ? 'Ocultar historial' : 'Ver historial de movimientos'}
      </button>

      {showTransactions && transactions.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium text-muted mb-2">
            Ultimos Movimientos
          </h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between items-center text-sm py-2 border-b border-border"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getTransactionColor(
                      tx.transaction_type
                    )} bg-background`}
                  >
                    {getTransactionIcon(tx.transaction_type)}
                  </span>
                  <div>
                    <p className="text-muted">{tx.notes || tx.transaction_type}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(tx.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    tx.amount > 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajustar Creditos</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Cantidad (positivo para agregar, negativo para quitar)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full border border-border rounded px-3 py-2"
                  placeholder="Ej: 5 o -2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Motivo del ajuste
                </label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2"
                  rows={2}
                  placeholder="Ej: Compensacion por clase cancelada"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAdjustModal(false)
                  setAdjustAmount(0)
                  setAdjustNotes('')
                }}
                className="px-4 py-2 border rounded hover:bg-surface-alt"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || adjustAmount === 0}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-accent disabled:opacity-50"
              >
                {adjusting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
