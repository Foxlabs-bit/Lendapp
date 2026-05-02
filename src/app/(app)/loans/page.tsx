'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { isWithinInterval, addDays, parseISO } from 'date-fns'

import { TopNav } from '@/components/layout/TopNav'
import { LendModal } from '@/components/loans/LendModal'
import { ReturnModal } from '@/components/loans/ReturnModal'
import { ExtendModal } from '@/components/loans/ExtendModal'
import { LoanTable } from '@/components/loans/LoanTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

import { useActiveLoans, useMarkLost } from '@/lib/hooks/useLoans'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isOverdue } from '@/lib/utils/formatters'
import type { LoanWithDetails } from '@/lib/supabase/types'

type FilterTab = 'all' | 'overdue' | 'week'

function ActiveLoansContent() {
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { data: loans = [], isLoading } = useActiveLoans()
  const markLost = useMarkLost()

  const [lendOpen, setLendOpen] = useState(false)
  const [returnLoan, setReturnLoan] = useState<LoanWithDetails | null>(null)
  const [extendLoan, setExtendLoan] = useState<LoanWithDetails | null>(null)

  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  // Auto-open lend modal from query param
  useEffect(() => {
    if (searchParams.get('lend') === 'true') {
      setLendOpen(true)
    }
  }, [searchParams])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('loans-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loans' },
        () => {
          qc.invalidateQueries({ queryKey: ['loans'] })
          qc.invalidateQueries({ queryKey: ['items'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  const handleMarkLost = async (id: string) => {
    try {
      await markLost.mutateAsync(id)
      toast.success('Loan marked as lost')
    } catch {
      toast.error('Failed to mark as lost')
    }
  }

  // Apply tab filter
  const tabFiltered = loans.filter((loan) => {
    if (tab === 'overdue') return isOverdue(loan.due_at)
    if (tab === 'week') {
      const now = new Date()
      const weekEnd = addDays(now, 7)
      try {
        return isWithinInterval(parseISO(loan.due_at), { start: now, end: weekEnd })
      } catch {
        return false
      }
    }
    return true
  })

  // Apply search filter
  const filtered = tabFiltered.filter((loan) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return loan.borrower_name.toLowerCase().includes(q)
  })

  const overdueCount = loans.filter((l) => isOverdue(l.due_at)).length

  return (
    <div className="min-h-screen">
      <TopNav title="Active Loans" />

      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
              <TabsList>
                <TabsTrigger value="all">
                  All
                  {loans.length > 0 && (
                    <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">
                      {loans.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue
                  {overdueCount > 0 && (
                    <span className="ml-1.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full px-1.5 py-0.5">
                      {overdueCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="week">Due This Week</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search borrower…"
                className="pl-8 w-48 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={() => setLendOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Lend an Item
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoanTableSkeleton />
        ) : (
          <LoanTable
            loans={filtered}
            onReturn={setReturnLoan}
            onExtend={setExtendLoan}
            onMarkLost={handleMarkLost}
          />
        )}
      </div>

      {/* Modals */}
      <LendModal open={lendOpen} onClose={() => setLendOpen(false)} />
      <ReturnModal
        loan={returnLoan}
        open={!!returnLoan}
        onClose={() => setReturnLoan(null)}
      />
      <ExtendModal
        loan={extendLoan}
        open={!!extendLoan}
        onClose={() => setExtendLoan(null)}
      />
    </div>
  )
}

function LoanTableSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><TopNav title="Active Loans" /><LoanTableSkeleton /></div>}>
      <ActiveLoansContent />
    </Suspense>
  )
}
