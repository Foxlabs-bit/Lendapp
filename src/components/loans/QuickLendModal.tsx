'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { Camera, X, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { useItems, useCreateItem } from '@/lib/hooks/useItems'
import { useCreateLoan, useActiveLoans } from '@/lib/hooks/useLoans'
import { useBorrowers, useCreateBorrower } from '@/lib/hooks/useBorrowers'
import { usePlan } from '@/lib/hooks/usePlan'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const CHIPS = [
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function QuickLendModal({ open, onClose }: Props) {
  const { data: items = [] } = useItems()
  const { data: activeLoans = [] } = useActiveLoans()
  const { data: borrowers = [] } = useBorrowers()
  const createItem = useCreateItem()
  const createLoan = useCreateLoan()
  const createBorrower = useCreateBorrower()
  const { check, isPro } = usePlan()
  const supabase = createClient()

  const [itemName, setItemName] = useState('')
  const [borrowerName, setBorrowerName] = useState('')
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [chipDays, setChipDays] = useState<number | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saveToContacts, setSaveToContacts] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const borrowerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setItemName('')
      setBorrowerName('')
      setSelectedBorrowerId(null)
      setShowSuggestions(false)
      setChipDays(null)
      setCustomDate('')
      setImageFile(null)
      setPreview(null)
      setSaveToContacts(false)
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (borrowerContainerRef.current && !borrowerContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const suggestions = useMemo(() => {
    const q = borrowerName.trim().toLowerCase()
    if (!q) return []
    return borrowers.filter(b => b.name.toLowerCase().includes(q))
  }, [borrowerName, borrowers])

  const dueDate = chipDays !== null
    ? format(addDays(new Date(), chipDays), 'yyyy-MM-dd')
    : customDate

  const isNewBorrower = useMemo(() => {
    if (!borrowerName.trim() || selectedBorrowerId) return false
    return !borrowers.some(b => b.name.toLowerCase() === borrowerName.trim().toLowerCase())
  }, [borrowerName, borrowers, selectedBorrowerId])

  const canSubmit = itemName.trim() && borrowerName.trim() && dueDate && !loading

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (!itemName.trim()) {
      setItemName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  async function uploadImage(userId: string): Promise<string | null> {
    if (!imageFile || !isPro) return null
    const ext = imageFile.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('item-images').upload(path, imageFile)
    if (error) return null
    const { data } = supabase.storage.from('item-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const limit = check('create_loan', activeLoans.length)
    if (!limit.allowed) {
      setUpgradeMsg(limit.reason ?? '')
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const imageUrl = await uploadImage(user.id)

      const existing = items.find(
        i => i.name.toLowerCase() === itemName.trim().toLowerCase() && !i.is_archived
      )
      const item = existing ?? await createItem.mutateAsync({
        name: itemName.trim(),
        emoji: '📦',
        category: 'Other',
        total_quantity: 1,
        is_archived: false,
        description: null,
        serial_number: null,
        purchase_price: null,
        purchase_date: null,
        notes: null,
        image_url: imageUrl,
      })

      // If item existed and we have a new image, update it
      if (existing && imageUrl) {
        await supabase.from('items').update({ image_url: imageUrl }).eq('id', existing.id)
      }

      let borrowerId: string | null = selectedBorrowerId
      if (!borrowerId && isPro && saveToContacts && isNewBorrower) {
        const newBorrower = await createBorrower.mutateAsync({
          name: borrowerName.trim(),
          email: null,
          phone: null,
          avatar_emoji: '👤',
          notes: null,
        })
        borrowerId = newBorrower.id
      } else if (!borrowerId) {
        const matched = borrowers.find(b => b.name.toLowerCase() === borrowerName.trim().toLowerCase())
        if (matched) borrowerId = matched.id
      }

      await createLoan.mutateAsync({
        item_id: item.id,
        borrower_id: borrowerId,
        borrower_name: borrowerName.trim(),
        quantity: 1,
        status: 'active',
        borrowed_at: new Date().toISOString().split('T')[0],
        due_at: dueDate,
        returned_at: null,
        location_note: null,
        condition_out: null,
        condition_in: null,
        reminder_sent: false,
        notes: null,
      })

      toast.success(`Lent ${itemName.trim()} to ${borrowerName.trim()}`)
      onClose()
    } catch {
      toast.error('Failed to create loan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Lend
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            {preview ? (
              <div className="relative h-32 rounded-xl overflow-hidden">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setImageFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {!isPro && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs text-center py-1">
                    Upgrade to Pro to save photos
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-16 border-2 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Add a photo {isPro ? '(optional)' : '(optional · Pro to save)'}
              </button>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ql-item">What are you lending?</Label>
              <Input
                id="ql-item"
                placeholder="e.g. HDMI Cable"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5" ref={borrowerContainerRef}>
              <Label htmlFor="ql-borrower">To who?</Label>
              <div className="relative">
                <Input
                  id="ql-borrower"
                  placeholder="e.g. Alex"
                  value={borrowerName}
                  onChange={e => {
                    setBorrowerName(e.target.value)
                    setSelectedBorrowerId(null)
                    setSaveToContacts(false)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault()
                          setBorrowerName(b.name)
                          setSelectedBorrowerId(b.id)
                          setShowSuggestions(false)
                          setSaveToContacts(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent text-left"
                      >
                        <span className="text-base leading-none">{b.avatar_emoji ?? '👤'}</span>
                        <span className="font-medium">{b.name}</span>
                        {b.email && <span className="text-muted-foreground text-xs ml-auto truncate">{b.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isPro && isNewBorrower && borrowerName.trim() && (
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={saveToContacts}
                    onChange={e => setSaveToContacts(e.target.checked)}
                    className="rounded border-input"
                  />
                  Save &quot;{borrowerName.trim()}&quot; to contacts
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Return by</Label>
              <div className="flex flex-wrap gap-2">
                {CHIPS.map(({ label, days }) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => { setChipDays(days); setCustomDate('') }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      chipDays === days
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input text-muted-foreground hover:text-foreground hover:border-foreground/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
                <input
                  type="date"
                  value={customDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setCustomDate(e.target.value); setChipDays(null) }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors bg-background cursor-pointer',
                    customDate && chipDays === null
                      ? 'border-primary text-foreground'
                      : 'border-input text-muted-foreground'
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Lend it →
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} limitContext={upgradeMsg} />
    </>
  )
}
