'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile'
import { useMyOrg, useMyOrgMembership, useLeaveOrg, useDeleteOrg, useTransferOrg, useOrgMembers } from '@/lib/hooks/useOrg'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { Star, Sun, Moon, Monitor, Loader2, AlertTriangle, Shield, Users, Trash2, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: myOrg } = useMyOrg()
  const { data: membership } = useMyOrgMembership()
  const leaveOrg = useLeaveOrg()
  const deleteOrg = useDeleteOrg()
  const transferOrg = useTransferOrg()
  const { data: orgMembers = [] } = useOrgMembers(myOrg?.id)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joiningOrg, setJoiningOrg] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState(false)
  const [transferConfirm, setTransferConfirm] = useState(false)
  const [selectedNewOwner, setSelectedNewOwner] = useState('')
  const [proPromo, setProPromo] = useState('')
  const [showProPromo, setShowProPromo] = useState(false)
  const [redeemingProPromo, setRedeemingProPromo] = useState(false)

  async function handleSaveName() {
    await updateProfile.mutateAsync({ display_name: displayName.trim() || null })
    setEditingName(false)
    toast.success('Display name updated')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleCancelSubscription() {
    const res = await fetch('/api/square/cancel', { method: 'POST' })
    if (res.ok) toast.success('Subscription cancelled')
    else toast.error('Failed to cancel subscription')
  }

  async function handleJoinOrg() {
    if (!joinCode.trim()) return
    setJoiningOrg(true)
    try {
      const res = await fetch('/api/org/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ joinCode: joinCode.trim() }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to join org'); return }
      toast.success(`Join request sent to ${data.orgName}! Wait for the owner to approve.`)
      setJoinCode('')
    } catch {
      toast.error('Failed to send join request')
    } finally {
      setJoiningOrg(false)
    }
  }

  async function handleLeaveOrg() {
    try {
      await leaveOrg.mutateAsync()
      toast.success('Left organization')
      setLeaveConfirm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave org')
    }
  }

  async function handleDeleteOrg() {
    try {
      await deleteOrg.mutateAsync()
      toast.success('Organization deleted')
      setDeleteOrgConfirm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete org')
    }
  }

  async function handleTransferOrg() {
    if (!selectedNewOwner) return
    try {
      await transferOrg.mutateAsync(selectedNewOwner)
      toast.success('Ownership transferred')
      setTransferConfirm(false)
      setSelectedNewOwner('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer ownership')
    }
  }

  async function handleRedeemProPromo() {
    if (!proPromo.trim()) return
    setRedeemingProPromo(true)
    try {
      const res = await fetch('/api/pro/redeem-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: proPromo.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Invalid promo code'); return }
      toast.success('Pro plan activated!')
      setShowProPromo(false)
      setProPromo('')
    } catch {
      toast.error('Failed to redeem promo code')
    } finally {
      setRedeemingProPromo(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isLoading) return (
    <>
      <TopNav title="Profile" />
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </>
  )

  const isOrgOwner = profile?.org_role === 'owner'
  const isOrgMember = !!profile?.org_id && !isOrgOwner
  const membershipData = membership as { status: string; organizations: { name: string; id: string } | null } | null
  const isPendingMember = membershipData?.status === 'pending'
  const orgInfo = membershipData?.organizations ?? null

  return (
    <>
      <TopNav title="Profile" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Profile Info */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {profile?.display_name?.[0] ?? profile?.username?.[0] ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-lg flex items-center gap-2">
                  {profile?.display_name ?? profile?.username}
                  {profile?.plan === 'pro' && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  {profile?.plan === 'org' && <Shield className="h-4 w-4 text-blue-500" />}
                </p>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Display Name</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" autoFocus />
                  <Button onClick={handleSaveName} disabled={updateProfile.isPending}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{profile?.display_name ?? 'Not set'}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setDisplayName(profile?.display_name ?? ''); setEditingName(true) }}>Edit</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} required /></div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader><CardTitle>Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={
                profile?.plan === 'pro' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                profile?.plan === 'org' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                'bg-muted text-muted-foreground'
              }>
                {profile?.plan === 'pro' ? '⭐ Pro' : profile?.plan === 'org' ? '🛡️ Org' : 'Free'}
              </Badge>
            </div>
            {profile?.plan === 'free' && (
              <div className="space-y-2">
                <Link href="/upgrade">
                  <Button size="sm" className="gap-2">Upgrade — from €4.99/mo</Button>
                </Link>
                {!showProPromo ? (
                  <div>
                    <button onClick={() => setShowProPromo(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                      Have a promo code?
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Enter promo code"
                      value={proPromo}
                      onChange={e => setProPromo(e.target.value.toUpperCase())}
                      className="font-mono uppercase text-sm h-8 max-w-[180px]"
                    />
                    <Button size="sm" onClick={handleRedeemProPromo} disabled={redeemingProPromo || !proPromo.trim()}>
                      {redeemingProPromo ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Redeem'}
                    </Button>
                    <button onClick={() => setShowProPromo(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  </div>
                )}
              </div>
            )}
            {profile?.plan === 'pro' && (
              <Button variant="outline" size="sm" onClick={handleCancelSubscription}>Cancel Subscription</Button>
            )}
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isOrgOwner && myOrg && (
              <>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{myOrg.name}</p>
                    <p className="text-xs text-muted-foreground">You are the owner</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/org/admin">
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setTransferConfirm(true)} disabled={orgMembers.filter(m => m.role !== 'owner').length === 0}>
                    <ArrowRightLeft className="h-4 w-4" /> Transfer Ownership
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteOrgConfirm(true)}>
                    <Trash2 className="h-4 w-4" /> Delete Org
                  </Button>
                </div>
              </>
            )}

            {isOrgMember && !isPendingMember && orgInfo && (
              <>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{orgInfo.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {profile?.org_role}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLeaveConfirm(true)}>Leave Organization</Button>
              </>
            )}

            {isPendingMember && orgInfo && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending approval</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Your request to join <strong>{orgInfo.name}</strong> is waiting for the owner to approve.</p>
              </div>
            )}

            {!profile?.org_id && !isPendingMember && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Have an org join code? Enter it below to request access.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="XXXX-XXXX"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    maxLength={9}
                  />
                  <Button onClick={handleJoinOrg} disabled={joiningOrg || !joinCode.trim()}>
                    {joiningOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <Button key={value} variant={theme === value ? 'default' : 'outline'} size="sm" onClick={() => setTheme(value)} className="gap-2">
                  <Icon className="h-4 w-4" />{label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all data. This cannot be undone.</p>
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>Delete Account</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={leaveConfirm} onOpenChange={setLeaveConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Leave organization?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You will lose access to org features. You can rejoin with the join code.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLeaveOrg} disabled={leaveOrg.isPending}>
              {leaveOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete your account?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete all your items, loans, and data. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOrgConfirm} onOpenChange={setDeleteOrgConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete organization?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{myOrg?.name}</strong> and remove all members. Everyone will be downgraded to the free plan. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrgConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={deleteOrg.isPending}>
              {deleteOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferConfirm} onOpenChange={setTransferConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer ownership</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Select a member to become the new owner. You will become a regular member.
          </p>
          <div className="space-y-2">
            {orgMembers.filter(m => m.role !== 'owner').map(m => (
              <button
                key={m.user_id}
                onClick={() => setSelectedNewOwner(m.user_id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${selectedNewOwner === m.user_id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(m.profiles.display_name ?? m.profiles.username)?.[0]?.toUpperCase()}
                </div>
                <span>{m.profiles.display_name ?? m.profiles.username}</span>
                <span className="text-muted-foreground">@{m.profiles.username}</span>
              </button>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setTransferConfirm(false); setSelectedNewOwner('') }}>Cancel</Button>
            <Button onClick={handleTransferOrg} disabled={!selectedNewOwner || transferOrg.isPending}>
              {transferOrg.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
