'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useLoans } from '@/lib/hooks/useLoans'
import { useItems } from '@/lib/hooks/useItems'
import { usePlan } from '@/lib/hooks/usePlan'
import { isOverdue } from '@/lib/utils/formatters'
import { subDays } from 'date-fns'

function StatCard({
  label,
  value,
  isPro,
  locked,
}: {
  label: string
  value: string | number
  isPro?: boolean
  locked?: boolean
}) {
  return (
    <Card className="flex-1 min-w-[130px]">
      <CardContent className="p-4">
        <div className="text-2xl font-bold">
          {locked ? (
            <span className="text-muted-foreground text-lg">—</span>
          ) : (
            value
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isPro && (
            <Badge className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
              ⭐ Pro
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatSkeleton() {
  return (
    <Card className="flex-1 min-w-[130px]">
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

export function StatsBar() {
  const { data: loans, isLoading: loansLoading } = useLoans()
  const { data: items, isLoading: itemsLoading } = useItems()
  const { isPro } = usePlan()

  const stats = useMemo(() => {
    if (!loans || !items) return null

    const now = new Date()
    const weekAgo = subDays(now, 7)

    const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue')
    const overdueLoans = loans.filter((l) => l.status === 'overdue' || (l.status === 'active' && isOverdue(l.due_at)))
    const returnedThisWeek = loans.filter(
      (l) => l.status === 'returned' && l.returned_at && new Date(l.returned_at) >= weekAgo
    )
    const nonArchivedItems = items.filter((i) => !i.is_archived)
    const activeBorrowers = new Set(activeLoans.map((l) => l.borrower_name)).size

    let avgDuration: number | null = null
    if (isPro) {
      const returnedLoans = loans.filter((l) => l.status === 'returned' && l.returned_at)
      if (returnedLoans.length > 0) {
        const totalDays = returnedLoans.reduce((sum, l) => {
          const ms = new Date(l.returned_at!).getTime() - new Date(l.borrowed_at).getTime()
          return sum + ms / (1000 * 60 * 60 * 24)
        }, 0)
        avgDuration = Math.round(totalDays / returnedLoans.length)
      }
    }

    return {
      itemsOut: activeLoans.length,
      overdue: overdueLoans.length,
      returnedThisWeek: returnedThisWeek.length,
      totalItems: nonArchivedItems.length,
      activeBorrowers,
      avgDuration,
    }
  }, [loans, items, isPro])

  const isLoading = loansLoading || itemsLoading

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      <StatCard label="Items Out" value={stats.itemsOut} />
      <StatCard label="Overdue" value={stats.overdue} />
      <StatCard label="Returned This Week" value={stats.returnedThisWeek} />
      <StatCard label="Total Items" value={stats.totalItems} />
      <StatCard label="Active Borrowers" value={stats.activeBorrowers} />
      <StatCard
        label="Avg Loan Duration"
        value={stats.avgDuration !== null ? `${stats.avgDuration}d` : 'No data'}
        isPro={!isPro}
        locked={!isPro}
      />
    </div>
  )
}
