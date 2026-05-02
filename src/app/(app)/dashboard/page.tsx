'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopNav } from '@/components/layout/TopNav'
import { OverdueAlert } from '@/components/dashboard/OverdueAlert'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { RecentFeed } from '@/components/dashboard/RecentFeed'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useUpdateProfile } from '@/lib/hooks/useProfile'
import { Plus, Package } from 'lucide-react'

function OnboardingDialog({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const updateProfile = useUpdateProfile()
  const router = useRouter()

  function handleFinish() {
    if (displayName.trim()) {
      updateProfile.mutate({ display_name: displayName.trim() })
    }
    onDone()
    router.replace('/dashboard')
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Step {step} of 3
          </div>
          {step === 1 && (
            <>
              <DialogTitle>Welcome to Lendapp! 👋</DialogTitle>
              <DialogDescription>What should we call you?</DialogDescription>
            </>
          )}
          {step === 2 && (
            <>
              <DialogTitle>Add your first item</DialogTitle>
              <DialogDescription>
                Track anything you lend — tools, books, electronics, gear and more.
                Head to the Items Library to add your first item.
              </DialogDescription>
            </>
          )}
          {step === 3 && (
            <>
              <DialogTitle>You&apos;re on the Free plan</DialogTitle>
              <DialogDescription>
                You can track up to 10 items and 25 active loans at no cost.
                Upgrade to Pro anytime for unlimited everything, reminders, and more.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {step === 1 && (
            <Input
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setStep(2) }}
              autoFocus
            />
          )}

          {step === 2 && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
              <p>📦 Give it a name and pick an emoji</p>
              <p>🗂️ Assign a category like Electronics or Tools</p>
              <p>🔢 Set how many you have available</p>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">Up to 10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active loans</span>
                <span className="font-medium">Up to 25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Free forever</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step < 3 ? (
              <Button className="w-full" onClick={() => setStep((s) => s + 1)}>
                {step === 1 ? 'Next →' : 'Got it →'}
              </Button>
            ) : (
              <Button className="w-full" onClick={handleFinish}>
                Start using Lendapp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShowOnboarding(true)
    }
  }, [searchParams])

  return (
    <>
      {showOnboarding && <OnboardingDialog onDone={() => setShowOnboarding(false)} />}

      <TopNav title="Dashboard" />

      <OverdueAlert />

      <main className="p-6 space-y-6">
        {/* Stats */}
        <StatsBar />

        {/* Quick actions */}
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/loans?lend=true">
              <Plus className="h-4 w-4 mr-2" />
              Lend an Item
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/items?add=true">
              <Package className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent active loans */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-semibold">Active Loans</h2>
            <RecentFeed />
          </div>

          {/* Activity feed */}
          <div className="space-y-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
