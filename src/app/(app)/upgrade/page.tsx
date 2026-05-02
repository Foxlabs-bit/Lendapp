'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/lib/hooks/useProfile'
import { Check, Zap, Star, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const FREE_FEATURES = ['Up to 10 items', 'Up to 25 loans (lifetime)', 'Basic loan tracking', 'Active loans dashboard']
const PRO_FEATURES = ['Unlimited items', 'Unlimited loans', 'Item photo uploads', 'Email & in-app reminders', 'CSV export', 'Borrower contacts book', 'Statistics & charts', 'Priority ⭐ badge']

declare global {
  interface Window {
    Square: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>
          tokenize: () => Promise<{ status: string; token?: string; errors?: unknown[] }>
        }>
      }>
    }
  }
}

export default function UpgradePage() {
  const { data: profile } = useProfile()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [squareReady, setSquareReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof window.Square.payments>>['card']>> | null>(null)

  useEffect(() => {
    if (!showPayment || !squareReady || !process.env.NEXT_PUBLIC_SQUARE_APP_ID || !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) return

    async function initSquare() {
      try {
        const payments = await window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        )
        const card = await payments.card()
        await card.attach('#card-container')
        cardRef.current = card
      } catch (err) {
        console.error('Square init failed:', err)
      }
    }
    initSquare()
  }, [showPayment, squareReady])

  async function handlePay() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const result = await cardRef.current.tokenize()
      if (result.status !== 'OK' || !result.token) {
        toast.error('Card tokenization failed')
        return
      }
      const res = await fetch('/api/square/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result.token }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Payment failed')
        return
      }
      setSuccess(true)
    } catch (err) {
      toast.error('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (profile?.plan === 'pro') {
    return (
      <>
        <TopNav title="Upgrade" />
        <div className="p-6 max-w-2xl mx-auto text-center py-20">
          <Star className="h-16 w-16 mx-auto mb-4 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">You&apos;re already on Pro!</h2>
          <p className="text-muted-foreground mb-6">You have access to all Pro features.</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <TopNav title="Upgrade" />
        <div className="p-6 max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Pro!</h2>
          <p className="text-muted-foreground mb-6">You now have unlimited items, loans, and all Pro features.</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </>
    )
  }

  if (showPayment) {
    return (
      <>
        <Script
          src="https://sandbox.web.squarecdn.com/v1/square.js"
          onReady={() => setSquareReady(true)}
        />
        <TopNav title="Upgrade to Pro" />
        <div className="p-6 max-w-md mx-auto">
          <button
            onClick={() => setShowPayment(false)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </button>

          <div className="mb-6 rounded-xl border border-primary bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">Pro Monthly</span>
            </div>
            <span className="text-2xl font-bold">€4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" /> Payment details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="card-container" className="min-h-[80px] border rounded-lg p-3 bg-background" />
              <Button onClick={handlePay} disabled={loading || !squareReady} className="w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {loading ? 'Processing...' : 'Subscribe for €4.99/mo'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Secured by Square. Cancel anytime from your profile.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav title="Upgrade to Pro" />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Unlock everything in Lend</h1>
          <p className="text-muted-foreground">One simple plan. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free
                <Badge variant="secondary">Current</Badge>
              </CardTitle>
              <p className="text-3xl font-bold">€0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />{f}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Pro</span>
                <Badge className="bg-yellow-100 text-yellow-700">Recommended</Badge>
              </CardTitle>
              <p className="text-3xl font-bold">€4.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />{f}
                </div>
              ))}
              <div className="pt-4">
                <Button className="w-full gap-2" onClick={() => setShowPayment(true)}>
                  <Zap className="h-4 w-4" /> Get Pro — €4.99/mo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
