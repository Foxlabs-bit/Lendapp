'use client'
import { useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useBorrowers, useCreateBorrower, useUpdateBorrower, useDeleteBorrower } from '@/lib/hooks/useBorrowers'
import { useLoans } from '@/lib/hooks/useLoans'
import { usePlan } from '@/lib/hooks/usePlan'
import { STATUS_COLORS, formatDate } from '@/lib/utils/formatters'
import type { Borrower } from '@/lib/supabase/types'
import { Plus, MoreHorizontal, Edit, Trash2, Users, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

function BorrowerSheet({ borrower, open, onClose }: { borrower: Borrower | null; open: boolean; onClose: () => void }) {
  const { data: loans = [] } = useLoans()
  const borrowerLoans = loans.filter(l => l.borrower_id === borrower?.id || l.borrower_name === borrower?.name)
  const active = borrowerLoans.filter(l => l.status === 'active' || l.status === 'overdue')

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="text-4xl">{borrower?.avatar_emoji ?? '👤'}</span>
            <div>
              <p className="text-xl">{borrower?.name}</p>
              <p className="text-sm text-muted-foreground font-normal">{borrower?.total_loans ?? 0} total loans</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {borrower?.email && <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{borrower.email}</p>}
          {borrower?.phone && <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{borrower.phone}</p>}
          {borrower?.notes && <p className="text-sm text-muted-foreground">{borrower.notes}</p>}

          <div>
            <p className="font-semibold mb-3">Currently Holding ({active.length})</p>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing currently.</p>
            ) : active.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2 text-sm">
                <span>{l.items?.emoji} {l.items?.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Due {formatDate(l.due_at)}</span>
                  <Badge className={`text-xs ${STATUS_COLORS[l.status]}`}>{l.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="font-semibold mb-3">Past Loans</p>
            {borrowerLoans.filter(l => l.status === 'returned' || l.status === 'lost').slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-2 text-sm">
                <span>{l.items?.emoji} {l.items?.name}</span>
                <Badge className={`text-xs ${STATUS_COLORS[l.status]}`}>{l.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function BorrowersPage() {
  const { isPro } = usePlan()
  const [upgradeOpen, setUpgradeOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editBorrower, setEditBorrower] = useState<Borrower | null>(null)
  const [viewBorrower, setViewBorrower] = useState<Borrower | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Borrower | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', avatar_emoji: '👤', notes: '' })

  const { data: borrowers = [], isLoading } = useBorrowers()
  const createBorrower = useCreateBorrower()
  const updateBorrower = useUpdateBorrower()
  const deleteBorrower = useDeleteBorrower()

  const filtered = borrowers.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSave() {
    if (!form.name.trim()) return
    if (editBorrower) {
      await updateBorrower.mutateAsync({ id: editBorrower.id, ...form })
      toast.success('Contact updated')
    } else {
      await createBorrower.mutateAsync(form)
      toast.success('Contact added')
    }
    setAddOpen(false)
    setEditBorrower(null)
    setForm({ name: '', email: '', phone: '', avatar_emoji: '👤', notes: '' })
  }

  if (!isPro) {
    return (
      <>
        <TopNav title="Borrowers" />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="relative">
            <div className="blur-sm pointer-events-none grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['Alice Johnson', 'Bob Smith', 'Carol White'].map(name => (
                <Card key={name}><CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👤</span>
                    <div><p className="font-semibold">{name}</p><p className="text-sm text-muted-foreground">3 loans</p></div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} limitContext="Borrower contacts are a Pro feature — save and manage the people you lend to." />
      </>
    )
  }

  return (
    <>
      <TopNav title="Borrowers" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex gap-3 mb-6">
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          <Button onClick={() => { setForm({ name: '', email: '', phone: '', avatar_emoji: '👤', notes: '' }); setAddOpen(true) }} className="gap-2 ml-auto">
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No contacts yet</p>
            <p className="text-sm mb-6">Contacts are auto-created when you lend to someone, or add them manually.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(b => (
              <Card key={b.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewBorrower(b)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl mt-1">{b.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{b.name}</p>
                      {b.email && <p className="text-xs text-muted-foreground truncate">{b.email}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{b.total_loans} total loans</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setForm({ name: b.name, email: b.email ?? '', phone: b.phone ?? '', avatar_emoji: b.avatar_emoji, notes: b.notes ?? '' }); setEditBorrower(b); setAddOpen(true) }} className="gap-2">
                          <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteConfirm(b) }} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={v => { if (!v) { setAddOpen(false); setEditBorrower(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBorrower ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BorrowerSheet borrower={viewBorrower} open={!!viewBorrower} onClose={() => setViewBorrower(null)} />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteConfirm?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Their loan history will be preserved but the contact will be removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { await deleteBorrower.mutateAsync(deleteConfirm!.id); setDeleteConfirm(null); toast.success('Contact deleted') }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
