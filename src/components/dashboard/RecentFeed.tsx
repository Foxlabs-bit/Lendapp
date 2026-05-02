'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveLoans } from '@/lib/hooks/useLoans'
import { formatDate, isOverdue } from '@/lib/utils/formatters'
import { PackageOpen } from 'lucide-react'

function LoanCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function RecentFeed() {
  const { data: loans, isLoading } = useActiveLoans()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoanCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const recentLoans = (loans ?? []).slice(0, 6)

  if (recentLoans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
        <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">No active loans</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Start lending items to track them here</p>
        </div>
        <Button asChild size="sm">
          <Link href="/loans">Lend an item</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {recentLoans.map((loan) => {
        const overdue = loan.status === 'overdue' || isOverdue(loan.due_at)
        return (
          <Card
            key={loan.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardContent className="p-4 space-y-2">
              <div className="text-3xl">{loan.items?.emoji ?? '📦'}</div>
              <div>
                <div className="font-semibold text-sm leading-tight">{loan.items?.name ?? 'Unknown Item'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{loan.borrower_name}</div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Due {formatDate(loan.due_at)}</span>
                {overdue && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0">
                    OVERDUE
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
