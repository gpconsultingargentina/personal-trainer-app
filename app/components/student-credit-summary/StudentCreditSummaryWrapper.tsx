'use client'

import { useRouter } from 'next/navigation'
import StudentCreditSummary from './StudentCreditSummary'
import { adjustCredits } from '@/app/actions/credits'
import type { StudentCreditSummary as CreditSummaryType } from '@/app/actions/credits'
import type { CreditTransaction } from '@/app/actions/credits'

interface StudentCreditSummaryWrapperProps {
  studentId: string
  summary: CreditSummaryType
  transactions: CreditTransaction[]
}

export default function StudentCreditSummaryWrapper({
  studentId,
  summary,
  transactions,
}: StudentCreditSummaryWrapperProps) {
  const router = useRouter()

  const handleAdjustCredits = async (amount: number, notes: string) => {
    await adjustCredits(studentId, amount, notes)
    router.refresh()
  }

  return (
    <StudentCreditSummary
      summary={summary}
      transactions={transactions}
      onAdjustCredits={handleAdjustCredits}
    />
  )
}
