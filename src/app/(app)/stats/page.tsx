'use client'
import { useState, useMemo } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoans } from '@/lib/hooks/useLoans'
import { usePlan } from '@/lib/hooks/usePlan'
import { formatDate } from '@/lib/utils/formatters'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { format, subDays, subMonths, eachMonthOfInterval, startOfMonth } from 'date-fns'
import { differenceInDays } from 'date-fns'
import { BarChart2 } from 'lucide-react'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

export default function StatsPage() {
  const { isPro } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(!isPro)
  const [dateRange, setDateRange] = useState('12m')

  const { data: loans = [], isLoading } = useLoans()

  const cutoff = useMemo(() => {
    if (dateRange === '30d') return subDays(new Date(), 30)
    if (dateRange === '90d') return subDays(new Date(), 90)
    if (dateRange === '1yr') return subDays(new Date(), 365)
    return new Date(0)
  }, [dateRange])

  const filteredLoans = useMemo(() =>
    loans.filter(l => new Date(l.borrowed_at) >= cutoff), [loans, cutoff])

  const overview = useMemo(() => {
    const total = filteredLoans.length
    const returned = filteredLoans.filter(l => l.status === 'returned')
    const returnRate = total > 0 ? Math.round((returned.length / total) * 100) : 0
    const avgDuration = returned.length > 0
      ? Math.round(returned.reduce((sum, l) => sum + differenceInDays(new Date(l.returned_at!), new Date(l.borrowed_at)), 0) / returned.length)
      : 0
    const itemCounts = filteredLoans.reduce((acc, l) => {
      acc[l.items?.name ?? 'Unknown'] = (acc[l.items?.name ?? 'Unknown'] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostLent = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    const borrowerCounts = filteredLoans.reduce((acc, l) => {
      acc[l.borrower_name] = (acc[l.borrower_name] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostTrusted = Object.entries(borrowerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return { total, returnRate, avgDuration, mostLent, mostTrusted }
  }, [filteredLoans])

  const loansOverTime = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() })
    return months.map(month => {
      const label = format(month, 'MMM yy')
      const created = filteredLoans.filter(l => format(new Date(l.borrowed_at), 'MMM yy') === label).length
      const returned = filteredLoans.filter(l => l.returned_at && format(new Date(l.returned_at), 'MMM yy') === label).length
      return { label, created, returned }
    })
  }, [filteredLoans])

  const categoryData = useMemo(() => {
    const counts = filteredLoans.reduce((acc, l) => {
      const cat = l.items?.category ?? 'Other'
      acc[cat] = (acc[cat] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredLoans])

  const topBorrowers = useMemo(() => {
    const counts = filteredLoans.reduce((acc, l) => {
      acc[l.borrower_name] = (acc[l.borrower_name] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }, [filteredLoans])

  if (!isPro) {
    return (
      <>
        <TopNav title="Statistics" />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="relative">
            <div className="blur-sm pointer-events-none grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {['Total Loans', 'Return Rate', 'Avg Duration', 'Most Lent'].map(label => (
                <Card key={label}><CardContent className="p-4"><p className="text-2xl font-bold">—</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>
              ))}
            </div>
            <div className="blur-sm pointer-events-none h-48 bg-muted rounded-xl" />
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} limitContext="Statistics & charts are a Pro feature" />
      </>
    )
  }

  return (
    <>
      <TopNav title="Statistics" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1yr">Last year</SelectItem>
              <SelectItem value="12m">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Loans', value: overview.total },
                { label: 'Return Rate', value: `${overview.returnRate}%` },
                { label: 'Avg Duration', value: `${overview.avgDuration}d` },
                { label: 'Most Lent', value: overview.mostLent },
                { label: 'Most Trusted', value: overview.mostTrusted },
              ].map(({ label, value }) => (
                <Card key={label}><CardContent className="pt-4 pb-3">
                  <p className="text-2xl font-bold truncate">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Loans Over Time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={loansOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#6366f1" name="Lent out" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="returned" stroke="#22c55e" name="Returned" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Items by Category</CardTitle></CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Top Borrowers</CardTitle></CardHeader>
                <CardContent>
                  {topBorrowers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topBorrowers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" name="Loans" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
