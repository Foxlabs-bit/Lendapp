'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useReturnLoan } from '@/lib/hooks/useLoans'
import type { LoanWithDetails } from '@/lib/supabase/types'

interface ReturnModalProps {
  loan: LoanWithDetails | null
  open: boolean
  onClose: () => void
}

export function ReturnModal({ loan, open, onClose }: ReturnModalProps) {
  const returnLoan = useReturnLoan()
  const [conditionIn, setConditionIn] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setConditionIn('')
      setNotes('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (!loan) return

    try {
      await returnLoan.mutateAsync({
        id: loan.id,
        condition_in: conditionIn.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast.success(
        `${loan.items?.emoji ?? ''} ${loan.items?.name ?? 'Item'} marked as returned`
      )
      onClose()
    } catch (err) {
      toast.error('Failed to mark as returned. Please try again.')
      console.error(err)
    }
  }

  if (!loan) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-500" />
            Mark as Returned
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {loan.items?.emoji} {loan.items?.name}
            </span>{' '}
            borrowed by{' '}
            <span className="font-medium text-foreground">{loan.borrower_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="condition-in">
              Condition In{' '}
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Input
              id="condition-in"
              placeholder='e.g. "Returned in good condition"'
              value={conditionIn}
              onChange={(e) => setConditionIn(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-notes">
              Notes{' '}
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Textarea
              id="return-notes"
              placeholder="Any notes about the return…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={returnLoan.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {returnLoan.isPending ? 'Marking…' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
