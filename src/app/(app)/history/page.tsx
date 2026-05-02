'use client'
import { useState, useMemo } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLoans, useLoanEvents } from '@/lib/hooks/useLoans'
import { usePlan } from '@/lib/hooks/usePlan'
import { exportLoansToCSV } from '@/lib/utils/export'
import { formatDate, formatRelative, STATUS_COLORS } from '@/lib/utils/formatters'
import type { LoanWithDetails } from '@/lib/supabase/types'
import { Download, ChevronDown, ChevronRight, Clock, History } from 'lucide-react'
import { subDays } from 'date-fns'

const EVENT_ICONS: Record<string, string> = {
  created: '📤', returned: '✅', extended: '📅', lost: '😞', reminder_sent: '🔔',
}

function LoanRow({ loan }: { loan: LoanWithDetails }) {
  const [expanded, setExpanded] = useState(false)
  const { data: events = [] as Array<{ id: string; event_type: string; created_at: string }> } = useLoanEvents(expanded ? loan.id : undefined)

  return (
    <>
      <TableRow
        className={`cursor-pointer hover:bg-muted/50 ${loan.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="text-2xl w-12">{loan.items?.emoji}</TableCell>
        <TableCell className="font-medium">{loan.items?.name}</TableCell>
        <TableCell>{loan.borrower_name}</TableCell>
        <TableCell className="text-center">{loan.quantity}</TableCell>
        <TableCell>{formatDate(loan.borrowed_at)}</TableCell>
        <TableCell>{formatDate(loan.due_at)}</TableCell>
        <TableCell>{loan.returned_at ? formatDate(loan.returned_at) : '—'}</TableCell>
        <TableCell>
          <Badge className={`text-xs ${STATUS_COLORS[loan.status]}`}>{loan.status}</Badge>
        </TableCell>
        <TableCell className="w-8">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={9} className="py-3 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                {loan.location_note && <p><span className="text-muted-foreground">Location:</span> {loan.location_note}</p>}
                {loan.condition_out && <p><span className="text-muted-foreground">Condition out:</span> {loan.condition_out}</p>}
                {loan.condition_in && <p><span className="text-muted-foreground">Condition in:</span> {loan.condition_in}</p>}
                {loan.notes && <p><span className="text-muted-foreground">Notes:</span> {loan.notes}</p>}
              </div>
              {events.length > 0 && (
                <div>
                  <p className="font-medium mb-2 flex items-center gap-1"><Clock className="h-4 w-4" /> Timeline</p>
                  <div className="space-y-1">
                    {events.map(ev => (
                      <div key={ev.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span>{EVENT_ICONS[ev.event_type] ?? '•'}</span>
                        <span className="capitalize">{ev.event_type.replace('_', ' ')}</span>
                        <span className="ml-auto">{formatRelative(ev.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const { data: loans = [], isLoading } = useLoans()
  const { isPro } = usePlan()

  const filtered = useMemo(() => {
    let list = loans
    if (search) list = list.filter(l =>
      l.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
      l.items?.name.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'all') list = list.filter(l => l.status === statusFilter)
    if (dateRange !== 'all') {
      const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
      const cutoff = subDays(new Date(), days)
      list = list.filter(l => new Date(l.borrowed_at) >= cutoff)
    }
    return list
  }, [loans, search, statusFilter, dateRange])

  function handleExport() {
    if (!isPro) { setUpgradeOpen(true); return }
    exportLoansToCSV(filtered)
  }

  return (
    <>
      <TopNav title="History" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input placeholder="Search by item or borrower..." value={search} onChange={e => setSearch(e.target.value)} className="sm:w-64" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1yr">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2 ml-auto">
            <Download className="h-4 w-4" />
            Export CSV {!isPro && '(Pro)'}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No loan history yet</p>
            <p className="text-sm">Your complete lending history will appear here.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(loan => <LoanRow key={loan.id} loan={loan} />)}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} limitContext="CSV export is a Pro feature" />
    </>
  )
}
