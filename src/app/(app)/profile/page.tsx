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
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { Star, Sun, Moon, Monitor, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
      setCurrentPassword('')
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
              <Badge className={profile?.plan === 'pro' ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}>
                {profile?.plan === 'pro' ? '⭐ Pro' : 'Free'}
              </Badge>
              {profile?.plan === 'pro' && <span className="text-sm text-muted-foreground">Next billing: June 1, 2026</span>}
            </div>
            {profile?.plan === 'pro' ? (
              <Button variant="outline" size="sm" onClick={handleCancelSubscription}>Cancel Subscription</Button>
            ) : (
              <Link href="/upgrade">
                <Button size="sm" className="gap-2">Upgrade to Pro — $4.99/mo</Button>
              </Link>
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
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
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
    </>
  )
}
