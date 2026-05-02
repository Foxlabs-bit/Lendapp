'use client'
import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyOrg, useOrgMembers, useOrgPendingRequests, useApproveOrgMember, useRemoveOrgMember } from '@/lib/hooks/useOrg'
import { useProfile } from '@/lib/hooks/useProfile'
import { Users, Copy, Check, Package, AlertTriangle, Clock, Shield, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface OrgData {
  items: Array<{ id: string; name: string; emoji: string; owner_id: string; profiles: { username: string; display_name: string | null } | null }>
  loans: Array<{ id: string; borrower_name: string; due_at: string; status: string; owner_id: string; items: { name: string; emoji: string } | null; profiles: { username: string; display_name: string | null } | null }>
  memberCount: number
}

export default function OrgAdminPage() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { data: org, isLoading: orgLoading } = useMyOrg()
  const { data: members = [], isLoading: membersLoading } = useOrgMembers(org?.id)
  const { data: pending = [], isLoading: pendingLoading } = useOrgPendingRequests(org?.id)
  const approveчлен = useApproveOrgMember()
  const removeMember = useRemoveOrgMember()
  const [codeCopied, setCodeCopied] = useState(false)
  const [orgData, setOrgData] = useState<OrgData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    if (profile.org_role !== 'owner') { router.push('/dashboard'); return }
  }, [profile, router])

  useEffect(() => {
    if (!org) return
    setDataLoading(true)
    fetch('/api/org/data')
      .then(r => r.json())
      .then(d => setOrgData(d))
      .finally(() => setDataLoading(false))
  }, [org])

  function copyCode() {
    if (!org) return
    navigator.clipboard.writeText(org.join_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
    toast.success('Join code copied!')
  }

  async function handleApprove(memberId: string, approved: boolean) {
    try {
      await approveчлен.mutateAsync({ memberId, approved })
      toast.success(approved ? 'Member approved' : 'Request denied')
    } catch {
      toast.error('Failed to update request')
    }
  }

  async function handleRemove(userId: string, name: string) {
    try {
      await removeMember.mutateAsync(userId)
      toast.success(`${name} removed from org`)
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (orgLoading) return (
    <>
      <TopNav title="Org Admin" />
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </>
  )

  if (!org) return (
    <>
      <TopNav title="Org Admin" />
      <div className="p-6 max-w-2xl mx-auto text-center py-20 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium mb-2">No organization found</p>
        <p className="text-sm mb-6">Purchase an Org plan to create your organization.</p>
        <Button onClick={() => router.push('/upgrade')}>Get Org Plan</Button>
      </div>
    </>
  )

  const seatsUsed = members.length
  const seatsFree = org.seat_limit - seatsUsed

  return (
    <>
      <TopNav title="Org Admin" />
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Org header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{org.name}</h2>
                <p className="text-sm text-muted-foreground">{seatsUsed} of {org.seat_limit} seats used · {seatsFree} available</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <p className="text-xs text-muted-foreground mb-1">Join Code</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                    <span className="font-mono font-bold tracking-widest text-sm">{org.join_code}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCode}>
                      {codeCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{seatsUsed}</p>
                <p className="text-xs text-muted-foreground">Active members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Pending requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{orgData?.items.length ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Org items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{orgData?.loans.length ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Active loans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={pending.length > 0 ? 'requests' : 'members'}>
          <TabsList>
            <TabsTrigger value="requests" className="gap-2">
              Requests
              {pending.length > 0 && <Badge className="h-5 px-1.5 text-xs">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="items">Org Items</TabsTrigger>
            <TabsTrigger value="loans">Active Loans</TabsTrigger>
          </TabsList>

          {/* Join Requests */}
          <TabsContent value="requests" className="mt-4">
            {pendingLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No pending join requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map(m => (
                  <Card key={m.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm">
                          {(m.profiles.display_name ?? m.profiles.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{m.profiles.display_name ?? m.profiles.username}</p>
                        <p className="text-xs text-muted-foreground">@{m.profiles.username} · requested {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleApprove(m.id, false)} disabled={approveчлен.isPending}>
                          <UserX className="h-3.5 w-3.5" /> Deny
                        </Button>
                        <Button size="sm" className="gap-1" onClick={() => handleApprove(m.id, true)} disabled={approveчлен.isPending}>
                          <UserCheck className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members */}
          <TabsContent value="members" className="mt-4">
            {membersLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <Card key={m.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm">
                          {(m.profiles.display_name ?? m.profiles.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {m.profiles.display_name ?? m.profiles.username}
                          {m.role === 'owner' && <Badge variant="secondary" className="text-xs">Owner</Badge>}
                          {m.role === 'admin' && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          @{m.profiles.username} · joined {m.joined_at ? formatDistanceToNow(new Date(m.joined_at), { addSuffix: true }) : 'recently'}
                        </p>
                      </div>
                      {m.role !== 'owner' && (
                        <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleRemove(m.user_id, m.profiles.display_name ?? m.profiles.username)} disabled={removeMember.isPending}>
                          <UserX className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Org Items */}
          <TabsContent value="items" className="mt-4">
            {dataLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : !orgData?.items.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No items across the org yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {orgData.items.map(item => (
                  <Card key={item.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">by {item.profiles?.display_name ?? item.profiles?.username ?? 'unknown'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Org Loans */}
          <TabsContent value="loans" className="mt-4">
            {dataLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : !orgData?.loans.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No active loans across the org</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orgData.loans.map(loan => (
                  <Card key={loan.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <span className="text-xl">{loan.items?.emoji ?? '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{loan.items?.name ?? 'Unknown item'} → {loan.borrower_name}</p>
                        <p className="text-xs text-muted-foreground">
                          by {loan.profiles?.display_name ?? loan.profiles?.username ?? 'unknown'} · due {new Date(loan.due_at).toLocaleDateString()}
                        </p>
                      </div>
                      {loan.status === 'overdue' && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
