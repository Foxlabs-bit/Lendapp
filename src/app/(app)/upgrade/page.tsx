'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile } from '@/lib/hooks/useProfile'
import { Check, Zap, Star, Loader2, ArrowLeft, Shield, Users, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const FREE_FEATURES = ['Up to 10 items', 'Up to 25 loans (lifetime)', 'Basic loan tracking', 'Active loans dashboard']
const PRO_FEATURES = ['Unlimited items & loans', 'Item photo uploads', 'Email & in-app reminders', 'CSV export', 'Borrower contacts book', 'Statistics & charts', 'Priority ⭐ badge']
const ORG_FEATURES = ['Everything in Pro', 'Multi-user shared workspace', 'Org admin dashboard', 'Cross-member item visibility', 'Org-wide loan overview', 'Member management & roles', 'Join request approval flow', 'Org audit log']

const SEAT_OPTIONS = [5, 10, 15, 25, 50, 100]
const PRICE_PER_SEAT = 3

type PaymentMode = null | 'pro' | 'org'

function UpgradeContent() {
  const { data: profile } = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<'pro' | 'org' | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(null)
  const [seatCount, setSeatCount] = useState(5)
  const [orgName, setOrgName] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const [redeemingPromo, setRedeemingPromo] = useState(false)
  const [proPromoCode, setProPromoCode] = useState('')
  const [showProPromo, setShowProPromo] = useState(false)
  const [redeemingProPromo, setRedeemingProPromo] = useState(false)

  // Handle return from Polar checkout
  useEffect(() => {
    const s = searchParams.get('success')
    if (s === 'pro') setSuccess('pro')
    if (s === 'org') setSuccess('org')
  }, [searchParams])

  async function handleCheckout(type: 'pro' | 'org') {
    setLoading(true)
    try {
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'org'
          ? { type: 'org', orgName: orgName.trim(), seatLimit: seatCount }
          : { type: 'pro' }
        ),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to start checkout'); return }
      window.location.href = data.url
    } catch {
      toast.error('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  async function handleRedeemProPromo() {
    if (!proPromoCode.trim()) return
    setRedeemingProPromo(true)
    try {
      const res = await fetch('/api/pro/redeem-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: proPromoCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Invalid promo code'); return }
      setSuccess('pro')
    } catch { toast.error('Failed to redeem promo code') } finally { setRedeemingProPromo(false) }
  }

  async function handleRedeemPromo() {
    if (!orgName.trim()) { toast.error('Please enter your organization name'); return }
    if (!promoCode.trim()) { toast.error('Please enter a promo code'); return }
    setRedeemingPromo(true)
    try {
      const res = await fetch('/api/org/redeem-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: promoCode.trim(), orgName: orgName.trim(), seatLimit: seatCount }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Invalid promo code'); return }
      setSuccess('org')
    } catch { toast.error('Failed to redeem promo code') } finally { setRedeemingPromo(false) }
  }

  if (profile?.plan === 'pro' || profile?.plan === 'org') {
    return (
      <>
        <TopNav title="Upgrade" />
        <div className="p-6 max-w-2xl mx-auto text-center py-20">
          <Star className="h-16 w-16 mx-auto mb-4 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">You&apos;re already on {profile.plan === 'org' ? 'Org' : 'Pro'}!</h2>
          <p className="text-muted-foreground mb-6">You have access to all features.</p>
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
          <h2 className="text-2xl font-bold mb-2">{success === 'org' ? `Welcome to ${orgName || 'your org'}!` : 'Welcome to Pro!'}</h2>
          <p className="text-muted-foreground mb-2">
            {success === 'org' ? 'Your organization is being set up — this takes a few seconds.' : 'You now have unlimited items, loans, and all Pro features.'}
          </p>
          {success === 'org' && (
            <p className="text-xs text-muted-foreground mb-6">If your org admin panel isn&apos;t ready yet, wait a moment and refresh.</p>
          )}
          {success === 'pro' && <p className="text-muted-foreground mb-6" />}
          <Button onClick={() => router.push(success === 'org' ? '/org/admin' : '/dashboard')}>
            {success === 'org' ? 'Go to Org Admin' : 'Go to Dashboard'}
          </Button>
        </div>
      </>
    )
  }

  if (paymentMode) {
    const isOrg = paymentMode === 'org'
    const price = isOrg ? seatCount * PRICE_PER_SEAT : 4.99

    return (
      <>
        <TopNav title={isOrg ? 'Get Org Plan' : 'Upgrade to Pro'} />
        <div className="p-6 max-w-md mx-auto">
          <button onClick={() => setPaymentMode(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </button>

          <div className="mb-6 rounded-xl border border-primary bg-primary/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isOrg ? <Shield className="h-5 w-5 text-blue-500" /> : <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                <span className="font-semibold">{isOrg ? 'Org Plan' : 'Pro Monthly'}</span>
              </div>
              <span className="text-2xl font-bold">€{price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
            </div>
            {isOrg && <p className="text-xs text-muted-foreground">{seatCount} seats × €{PRICE_PER_SEAT}/seat/mo</p>}
          </div>

          {isOrg && (
            <div className="mb-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input placeholder="e.g. Acme IT Department" value={orgName} onChange={e => setOrgName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Number of Seats</Label>
                <div className="flex flex-wrap gap-2">
                  {SEAT_OPTIONS.map(n => (
                    <button key={n} type="button" onClick={() => setSeatCount(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${seatCount === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{seatCount} seats = €{(seatCount * PRICE_PER_SEAT).toFixed(2)}/mo</p>
              </div>
            </div>
          )}

          {/* Promo code */}
          <div className="mb-4">
            {isOrg ? (
              !showPromo ? (
                <button onClick={() => setShowPromo(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="font-mono uppercase text-sm" />
                    <Button onClick={handleRedeemPromo} disabled={redeemingPromo || !promoCode.trim() || !orgName.trim()} size="sm">
                      {redeemingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                    </Button>
                  </div>
                  <button onClick={() => setShowPromo(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Pay instead
                  </button>
                </div>
              )
            ) : (
              !showProPromo ? (
                <button onClick={() => setShowProPromo(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" value={proPromoCode} onChange={e => setProPromoCode(e.target.value.toUpperCase())} className="font-mono uppercase text-sm" />
                    <Button onClick={handleRedeemProPromo} disabled={redeemingProPromo || !proPromoCode.trim()} size="sm">
                      {redeemingProPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                    </Button>
                  </div>
                  <button onClick={() => setShowProPromo(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Pay instead
                  </button>
                </div>
              )
            )}
          </div>

          {/* Checkout button — only show when not in promo mode */}
          {!showPromo && !showProPromo && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;ll be redirected to our secure payment page to complete your subscription.
                </p>
                <Button
                  onClick={() => handleCheckout(paymentMode)}
                  disabled={loading || (isOrg && !orgName.trim())}
                  className={`w-full gap-2 ${isOrg ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {loading ? 'Redirecting...' : `Subscribe for €${price.toFixed(2)}/mo`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Secured by Polar. Cancel anytime from your profile.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav title="Upgrade" />
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Unlock everything in Lend</h1>
          <p className="text-muted-foreground">Simple pricing. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">Free <Badge variant="secondary">Current</Badge></CardTitle>
              <p className="text-3xl font-bold">€0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4" />{f}</div>
              ))}
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Pro</span>
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Popular</Badge>
              </CardTitle>
              <p className="text-3xl font-bold">€4.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-500" />{f}</div>
              ))}
              <div className="pt-4">
                <Button className="w-full gap-2" onClick={() => setPaymentMode('pro')}>
                  <Zap className="h-4 w-4" /> Get Pro — €4.99/mo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Org */}
          <Card className="border-blue-500/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> Org</span>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Teams</Badge>
              </CardTitle>
              <div>
                <p className="text-3xl font-bold">€15<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">from €3/seat · min 5 seats</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              {ORG_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-blue-500" />{f}</div>
              ))}
              <div className="pt-4">
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setPaymentMode('org')}>
                  <Users className="h-4 w-4" /> Get Org — from €15/mo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function UpgradePage() {
  return <Suspense><UpgradeContent /></Suspense>
}
