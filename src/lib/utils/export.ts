import type { LoanWithDetails } from '@/lib/supabase/types'
import { formatDate } from './formatters'

export function exportLoansToCSV(loans: LoanWithDetails[]) {
  const headers = [
    'Item', 'Category', 'Borrower', 'Quantity', 'Status',
    'Borrowed Date', 'Due Date', 'Returned Date', 'Location Note',
    'Condition Out', 'Condition In', 'Notes',
  ]

  const rows = loans.map((loan) => [
    loan.items?.name ?? '',
    loan.items?.category ?? '',
    loan.borrower_name,
    loan.quantity.toString(),
    loan.status,
    formatDate(loan.borrowed_at),
    formatDate(loan.due_at),
    loan.returned_at ? formatDate(loan.returned_at) : '',
    loan.location_note ?? '',
    loan.condition_out ?? '',
    loan.condition_in ?? '',
    loan.notes ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `lend-history-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
