'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  limitContext: string
}

const PRO_FEATURES = [
  'Unlimited items (free plan: 10)',
  'Unlimited active loans (free plan: 25)',
  'Upload item photos',
  'Set loan reminders & alerts',
  'Borrower contact management',
  'Export loan history as CSV',
  'Advanced analytics & stats',
  'Priority support',
]

export function UpgradeModal({ open, onClose, limitContext }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
              Pro Plan
            </Badge>
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-sm text-destructive font-medium">
            {limitContext}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold">$4.99</div>
            <div className="text-sm text-muted-foreground">per month — cancel anytime</div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full" size="lg" onClick={onClose}>
              <Link href="/upgrade">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
