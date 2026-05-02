'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { CalendarIcon, CalendarDays } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { useExtendLoan } from '@/lib/hooks/useLoans'
import { formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { LoanWithDetails } from '@/lib/supabase/types'

interface ExtendModalProps {
  loan: LoanWithDetails | null
  open: boolean
  onClose: () => void
}

export function ExtendModal({ loan, open, onClose }: ExtendModalProps) {
  const extendLoan = useExtendLoan()
  const [newDate, setNewDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setNewDate(undefined)
    }
  }, [open])

  const handleConfirm = async () => {
    if (!loan || !newDate) return

    try {
      await extendLoan.mutateAsync({
        id: loan.id,
        due_at: format(newDate, 'yyyy-MM-dd'),
      })
      toast.success(
        `Due date extended to ${format(newDate, 'MMM d, yyyy')}`
      )
      onClose()
    } catch (err) {
      toast.error('Failed to extend due date. Please try again.')
      console.error(err)
    }
  }

  if (!loan) return null

  const minDate = addDays(new Date(), 1)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Extend Due Date
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {loan.items?.emoji} {loan.items?.name}
            </span>{' '}
            — currently due{' '}
            <span className="font-medium text-foreground">
              {formatDate(loan.due_at)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <Label>New Return Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !newDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newDate ? format(newDate, 'MMM d, yyyy') : 'Choose a new due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={(date) => {
                  setNewDate(date)
                  setCalendarOpen(false)
                }}
                disabled={(date) => date <= new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {newDate && (
            <p className="text-sm text-muted-foreground">
              Extension:{' '}
              <span className="font-medium text-foreground">
                {formatDate(loan.due_at)} → {format(newDate, 'MMM d, yyyy')}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newDate || extendLoan.isPending}
          >
            {extendLoan.isPending ? 'Extending…' : 'Extend Due Date'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
