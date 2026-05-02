'use client'

import { useState } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import { MoreHorizontal, RotateCcw, CalendarDays, AlertTriangle } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { formatDate, isOverdue, isDueSoon, STATUS_COLORS } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { LoanWithDetails } from '@/lib/supabase/types'

interface LoanTableProps {
  loans: LoanWithDetails[]
  onReturn: (loan: LoanWithDetails) => void
  onExtend: (loan: LoanWithDetails) => void
  onMarkLost: (id: string) => void
}

export function LoanTable({ loans, onReturn, onExtend, onMarkLost }: LoanTableProps) {
  const [confirmLostId, setConfirmLostId] = useState<string | null>(null)
  const confirmLoan = loans.find((l) => l.id === confirmLostId)

  // Sort: overdue first, then by due date ascending
  const sorted = [...loans].sort((a, b) => {
    const aOverdue = isOverdue(a.due_at)
    const bOverdue = isOverdue(b.due_at)
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <h3 className="font-semibold text-lg mb-1">No active loans</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Items you lend out will appear here. Click &quot;Lend an Item&quot; to get started.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead className="w-16 text-center">Qty</TableHead>
              <TableHead>Borrowed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((loan) => {
              const overdue = isOverdue(loan.due_at)
              const dueSoon = isDueSoon(loan.due_at, 3)
              const daysOverdue = overdue
                ? differenceInDays(new Date(), parseISO(loan.due_at))
                : 0

              return (
                <TableRow
                  key={loan.id}
                  className={cn(
                    overdue && 'bg-red-50 dark:bg-red-950/20'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{loan.items?.emoji}</span>
                      <span className="font-medium">{loan.items?.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {loan.borrowers ? (
                        <>
                          <span>{loan.borrowers.avatar_emoji}</span>
                          <span>{loan.borrower_name}</span>
                        </>
                      ) : (
                        <span>{loan.borrower_name}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">{loan.quantity}</TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(loan.borrowed_at)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className={cn(overdue && 'text-red-600 dark:text-red-400 font-medium')}>
                        {formatDate(loan.due_at)}
                      </div>
                      {overdue && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </div>
                      )}
                      {!overdue && dueSoon && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          due soon
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={cn('capitalize text-xs border-0', STATUS_COLORS[loan.status])}>
                      {loan.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onReturn(loan)}>
                          <RotateCcw className="h-4 w-4 mr-2 text-green-500" />
                          Mark Returned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExtend(loan)}>
                          <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                          Extend Due Date
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmLostId(loan.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark as Lost
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Lost Dialog */}
      <Dialog
        open={!!confirmLostId}
        onOpenChange={(v) => { if (!v) setConfirmLostId(null) }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Mark as Lost
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark{' '}
              <span className="font-medium text-foreground">
                {confirmLoan?.items?.emoji} {confirmLoan?.items?.name}
              </span>{' '}
              as lost? This cannot be undone easily.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLostId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmLostId) {
                  onMarkLost(confirmLostId)
                  setConfirmLostId(null)
                }
              }}
            >
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
