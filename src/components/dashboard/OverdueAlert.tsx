'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useLoans } from '@/lib/hooks/useLoans'
import { isOverdue } from '@/lib/utils/formatters'

export function OverdueAlert() {
  const { data: loans } = useLoans()

  if (!loans) return null

  const overdueCount = loans.filter(
    (l) => l.status === 'overdue' || (l.status === 'active' && isOverdue(l.due_at))
  ).length

  if (overdueCount === 0) return null

  return (
    <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          You have {overdueCount} overdue loan{overdueCount !== 1 ? 's' : ''}.
        </span>
      </div>
      <Link
        href="/loans?filter=overdue"
        className="text-sm font-semibold text-red-700 hover:underline dark:text-red-400 whitespace-nowrap"
      >
        View loans →
      </Link>
    </div>
  )
}
