'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { CalendarIcon, Users, Check, ChevronsUpDown } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { useItems, useItemAvailability } from '@/lib/hooks/useItems'
import { useCreateLoan } from '@/lib/hooks/useLoans'
import { useBorrowers, useCreateBorrower } from '@/lib/hooks/useBorrowers'
import { useActiveLoans } from '@/lib/hooks/useLoans'
import { usePlan } from '@/lib/hooks/usePlan'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { cn } from '@/lib/utils'

interface LendModalProps {
  open: boolean
  onClose: () => void
}

export function LendModal({ open, onClose }: LendModalProps) {
  const { data: items = [] } = useItems()
  const { data: borrowers = [] } = useBorrowers()
  const { data: activeLoans = [] } = useActiveLoans()
  const createLoan = useCreateLoan()
  const createBorrower = useCreateBorrower()
  const { isPro, check } = usePlan()

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerId, setBorrowerId] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined)
  const [locationNote, setLocationNote] = useState('')
  const [conditionOut, setConditionOut] = useState('')
  const [notes, setNotes] = useState('')
  const [saveToContacts, setSaveToContacts] = useState(false)

  // UI state
  const [itemPickerOpen, setItemPickerOpen] = useState(false)
  const [borrowerPickerOpen, setBorrowerPickerOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeContext, setUpgradeContext] = useState('')

  const availableItems = useMemo(
    () => items.filter((item) => !item.is_archived),
    [items]
  )

  const selectedItem = availableItems.find((i) => i.id === selectedItemId)

  const { data: availability } = useItemAvailability(selectedItemId)
  const availableQty = availability?.available ?? (selectedItem?.total_quantity ?? 0)

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setSelectedItemId('')
      setQuantity(1)
      setBorrowerName('')
      setBorrowerId(null)
      setReturnDate(undefined)
      setLocationNote('')
      setConditionOut('')
      setNotes('')
      setSaveToContacts(false)
    }
  }, [open])

  // Clamp quantity when item or availability changes
  useEffect(() => {
    if (availableQty > 0 && quantity > availableQty) {
      setQuantity(availableQty)
    }
  }, [availableQty, quantity])

  const isNewBorrower = useMemo(() => {
    if (!borrowerName.trim()) return false
    return !borrowers.some(
      (b) => b.name.toLowerCase() === borrowerName.toLowerCase()
    )
  }, [borrowerName, borrowers])

  const handleSelectBorrower = (b: { id: string; name: string }) => {
    setBorrowerName(b.name)
    setBorrowerId(b.id)
    setBorrowerPickerOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedItemId) {
      toast.error('Please select an item')
      return
    }
    if (!borrowerName.trim()) {
      toast.error('Please enter a borrower name')
      return
    }
    if (!returnDate) {
      toast.error('Please select a return date')
      return
    }
    if (availableQty < 1) {
      toast.error('No units available for that item')
      return
    }

    // Plan limit check
    const limitResult = check('create_loan', activeLoans.length)
    if (!limitResult.allowed) {
      setUpgradeContext(limitResult.reason ?? 'You have reached your loan limit.')
      setShowUpgrade(true)
      return
    }

    try {
      let finalBorrowerId = borrowerId

      if (isPro && saveToContacts && isNewBorrower && borrowerName.trim()) {
        const newBorrower = await createBorrower.mutateAsync({
          name: borrowerName.trim(),
          email: null,
          phone: null,
          avatar_emoji: '👤',
          notes: null,
        })
        finalBorrowerId = newBorrower.id
      }

      await createLoan.mutateAsync({
        item_id: selectedItemId,
        borrower_id: finalBorrowerId,
        borrower_name: borrowerName.trim(),
        quantity,
        status: 'active',
        borrowed_at: new Date().toISOString().split('T')[0],
        due_at: format(returnDate, 'yyyy-MM-dd'),
        returned_at: null,
        location_note: locationNote.trim() || null,
        condition_out: conditionOut.trim() || null,
        condition_in: null,
        reminder_sent: false,
        notes: notes.trim() || null,
      })

      toast.success(`${selectedItem?.emoji ?? ''} ${selectedItem?.name ?? 'Item'} lent to ${borrowerName}`)
      onClose()
    } catch (err) {
      toast.error('Failed to create loan. Please try again.')
      console.error(err)
    }
  }

  const today = new Date()
  const minDate = today

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lend an Item</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Selector */}
            <div className="space-y-1.5">
              <Label>Item <span className="text-destructive">*</span></Label>
              <Popover open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={itemPickerOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedItem ? (
                      <span>{selectedItem.emoji} {selectedItem.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select an item…</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search items…" />
                    <CommandList>
                      <CommandEmpty>No items found.</CommandEmpty>
                      <CommandGroup>
                        {availableItems
                          .filter((item) => {
                            // We'll compute availability inline for the picker list
                            return true
                          })
                          .map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.emoji} ${item.name}`}
                              onSelect={() => {
                                setSelectedItemId(item.id)
                                setQuantity(1)
                                setItemPickerOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedItemId === item.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="mr-2">{item.emoji}</span>
                              <span className="flex-1">{item.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                qty: {item.total_quantity}
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity">
                Quantity
                {selectedItemId && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (max {availableQty} available)
                  </span>
                )}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={availableQty || 1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setQuantity(Math.min(Math.max(1, val), availableQty || 1))
                }}
                disabled={!selectedItemId || availableQty < 1}
              />
              {selectedItemId && availableQty < 1 && (
                <p className="text-xs text-destructive">No units currently available</p>
              )}
            </div>

            {/* Borrower Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="borrower-name">
                  Borrower <span className="text-destructive">*</span>
                </Label>
                {isPro && (
                  <Popover open={borrowerPickerOpen} onOpenChange={setBorrowerPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Users className="h-3 w-3" />
                        Pick from contacts
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search contacts…" />
                        <CommandList>
                          <CommandEmpty>No contacts found.</CommandEmpty>
                          <CommandGroup>
                            {borrowers.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => handleSelectBorrower(b)}
                              >
                                <span className="mr-2">{b.avatar_emoji}</span>
                                <span>{b.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <Input
                id="borrower-name"
                placeholder="Enter borrower's name"
                value={borrowerName}
                onChange={(e) => {
                  setBorrowerName(e.target.value)
                  setBorrowerId(null)
                }}
                required
              />
              {isPro && isNewBorrower && borrowerName.trim() && (
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={saveToContacts}
                    onChange={(e) => setSaveToContacts(e.target.checked)}
                    className="rounded border-input"
                  />
                  Save &quot;{borrowerName}&quot; to contacts
                </label>
              )}
            </div>

            {/* Return Date */}
            <div className="space-y-1.5">
              <Label>Return Date <span className="text-destructive">*</span></Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !returnDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, 'MMM d, yyyy') : 'Pick a return date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => {
                      setReturnDate(date)
                      setCalendarOpen(false)
                    }}
                    disabled={(date) => date < minDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Optional fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="location-note">Location Note <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  id="location-note"
                  placeholder='e.g. "Left in garage"'
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condition-out">Condition Out <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  id="condition-out"
                  placeholder='e.g. "Good condition, minor scratches"'
                  value={conditionOut}
                  onChange={(e) => setConditionOut(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoan.isPending || !selectedItemId || !borrowerName.trim() || !returnDate || availableQty < 1}
              >
                {createLoan.isPending ? 'Lending…' : 'Lend Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        limitContext={upgradeContext}
      />
    </>
  )
}
