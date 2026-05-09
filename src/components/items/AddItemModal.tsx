'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCreateItem, useUpdateItem } from '@/lib/hooks/useItems'
import { useItems } from '@/lib/hooks/useItems'
import { usePlan } from '@/lib/hooks/usePlan'
import { EMOJI_OPTIONS, ITEM_CATEGORIES } from '@/lib/utils/formatters'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2 as SpinnerIcon } from 'lucide-react'
import type { Item, ItemCategory } from '@/lib/supabase/types'

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  editItem?: Item | null
}

const DEFAULT_EMOJI = '📦'
const DEFAULT_CATEGORY: ItemCategory = 'Other'

export function AddItemModal({ open, onClose, editItem }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI)
  const [category, setCategory] = useState<ItemCategory>(DEFAULT_CATEGORY)
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeContext, setUpgradeContext] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const { data: items } = useItems()
  const { check, isPro } = usePlan()
  const supabase = createClient()

  useEffect(() => {
    if (editItem) {
      setName(editItem.name)
      setEmoji(editItem.emoji)
      setCategory(editItem.category)
      setQuantity(editItem.total_quantity)
      setDescription(editItem.description ?? '')
      setSerialNumber(editItem.serial_number ?? '')
      setPurchasePrice(editItem.purchase_price?.toString() ?? '')
      setNotes(editItem.notes ?? '')
      setImagePreview(editItem.image_url ?? null)
      setImageFile(null)
    } else {
      resetForm()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editItem])

  function resetForm() {
    setName('')
    setEmoji(DEFAULT_EMOJI)
    setCategory(DEFAULT_CATEGORY)
    setQuantity(1)
    setDescription('')
    setSerialNumber('')
    setPurchasePrice('')
    setNotes('')
    setImageFile(null)
    setImagePreview(null)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleImageClick() {
    const limitResult = check('upload_image')
    if (!limitResult.allowed) {
      setUpgradeContext(limitResult.upgradeMessage ?? 'Upgrade to Pro to upload photos')
      setShowUpgrade(true)
      return
    }
    fileInputRef.current?.click()
  }

  async function uploadImage(userId: string): Promise<string | null> {
    if (!imageFile) return imagePreview
    setUploadingImage(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('item-images').upload(path, imageFile, { upsert: true, contentType: imageFile.type })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('item-images').getPublicUrl(path)
      return urlData.publicUrl
    } catch {
      toast.error('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Item name is required')
      return
    }

    if (!editItem) {
      const currentCount = items?.filter((i) => !i.is_archived).length ?? 0
      const limitResult = check('add_item', currentCount)
      if (!limitResult.allowed) {
        setUpgradeContext(limitResult.reason ?? 'You have reached your plan limit')
        setShowUpgrade(true)
        return
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const imageUrl = user ? await uploadImage(user.id) : null

      const payload = {
        name: name.trim(),
        emoji,
        category,
        total_quantity: quantity,
        description: description.trim() || null,
        serial_number: serialNumber.trim() || null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        notes: notes.trim() || null,
        image_url: imageUrl,
      }
      if (editItem) {
        await updateItem.mutateAsync({ id: editItem.id, ...payload })
        toast.success(`"${name}" updated`)
      } else {
        await createItem.mutateAsync({ ...payload, purchase_date: null, is_archived: false })
        toast.success(`"${name}" added to your library`)
      }
      handleClose()
    } catch (err) {
      console.error('Add item error:', JSON.stringify(err), err)
      toast.error(editItem ? 'Failed to update item.' : 'Failed to add item. Please try again.')
    }
  }

  return (
    <>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        limitContext={upgradeContext}
      />

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? `Edit ${editItem.name}` : 'Add New Item'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="item-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                placeholder="e.g. Camping Tent, Canon Camera..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Photo */}
            <div className="space-y-1.5">
              <Label>Photo {!isPro && <span className="text-xs text-muted-foreground ml-1">— Pro</span>}</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Item" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={handleImageClick}
                  className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  {uploadingImage ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="text-xs">{isPro ? 'Click to upload photo' : 'Pro feature — upgrade to add photos'}</span>
                </button>
              )}
            </div>

            {/* Emoji picker */}
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <div className="grid grid-cols-10 gap-1.5 p-3 rounded-lg border bg-muted/30">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={cn(
                      'text-xl h-9 w-9 rounded-md flex items-center justify-center transition-all hover:bg-background hover:shadow-sm',
                      emoji === em && 'bg-background shadow-sm ring-2 ring-primary'
                    )}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Selected: <span className="text-base">{emoji}</span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="item-qty">Quantity</Label>
              <Input
                id="item-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-1.5">
              <Label htmlFor="item-serial">Serial Number</Label>
              <Input
                id="item-serial"
                placeholder="Optional serial or model number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            {/* Purchase Price */}
            <div className="space-y-1.5">
              <Label htmlFor="item-price">Purchase Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="item-price"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="item-notes">Notes</Label>
              <Textarea
                id="item-notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createItem.isPending || updateItem.isPending || uploadingImage}
              >
                {editItem ? (updateItem.isPending ? 'Saving...' : 'Save Changes') : (createItem.isPending ? 'Adding...' : 'Add Item')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
