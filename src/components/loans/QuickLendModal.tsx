'use client'
import { useState, useRef, useEffect } from 'react'
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
import { usePlan } from '@/lib/hooks/usePlan'
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
  const createItem = useCreateItem()
  const createLoan = useCreateLoan()
  const { check } = usePlan()

  const [itemName, setItemName] = useState('')
  const [borrowerName, setBorrowerName] = useState('')
  const [chipDays, setChipDays] = useState<number | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setItemName('')
      setBorrowerName('')
      setChipDays(null)
      setCustomDate('')
      setPreview(null)
    }
  }, [open])

  const dueDate = chipDays !== null
    ? format(addDays(new Date(), chipDays), 'yyyy-MM-dd')
    : customDate

  const canSubmit = itemName.trim() && borrowerName.trim() && dueDate && !loading

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (!itemName.trim()) {
      setItemName(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    }
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
        image_url: null,
      })

      await createLoan.mutateAsync({
        item_id: item.id,
        borrower_id: null,
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
                  onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-16 border-2 border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Add a photo (optional)
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

            <div className="space-y-1.5">
              <Label htmlFor="ql-borrower">To who?</Label>
              <Input
                id="ql-borrower"
                placeholder="e.g. Alex"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                required
              />
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
