import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Check, Zap, Star, Shield, Users, Bell, BarChart2, BookUser, ImageIcon, ArrowRight, HandshakeIcon } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-primary rounded-xl p-1.5">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Lend</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Free to start — no credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Never forget who has<br />
            <span className="text-primary">your stuff</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Lend tracks everything you loan out — items, borrowers, due dates, and reminders — so nothing goes missing and no awkward conversations happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/register" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Start tracking for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 border border-border px-6 py-3 rounded-xl font-medium text-base hover:bg-muted transition-colors">
              Sign in to your account
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free plan includes 10 items and 25 loans forever.</p>
        </div>

        {/* Mock UI preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <div className="h-3 w-3 rounded-full bg-green-400/60" />
              <div className="mx-auto text-xs text-muted-foreground font-mono">lend.app/dashboard</div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Active loans', value: '12', color: 'text-blue-500' },
                { label: 'Items tracked', value: '34', color: 'text-green-500' },
                { label: 'Overdue', value: '2', color: 'text-red-500' },
                { label: 'Returned this month', value: '8', color: 'text-purple-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-border bg-background p-4">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2">
              {[
                { emoji: '🔧', name: 'Drill Machine', borrower: 'Alex K.', due: 'Due in 2 days', status: 'soon' },
                { emoji: '📚', name: 'Clean Code (book)', borrower: 'Maria S.', due: 'Overdue 3 days', status: 'overdue' },
                { emoji: '🎮', name: 'PS5 Controller', borrower: 'Tom B.', due: 'Due in 2 weeks', status: 'ok' },
              ].map(({ emoji, name, borrower, due, status }) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <span className="text-xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">→ {borrower}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                    status === 'soon' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  }`}>{due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to lend with confidence</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From your first item to managing a whole team&apos;s inventory — Lend scales with you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: HandshakeIcon, title: 'Loan tracking', desc: 'Log who borrowed what, when it\'s due, and its full history. Never lose track again.', color: 'text-blue-500 bg-blue-500/10' },
              { icon: Bell, title: 'Smart reminders', desc: 'Automatic email and in-app alerts before loans go overdue. No more chasing people.', color: 'text-yellow-500 bg-yellow-500/10', pro: true },
              { icon: BookUser, title: 'Borrower contacts', desc: 'Build a contact book of everyone you\'ve lent to. See their full borrowing history.', color: 'text-green-500 bg-green-500/10', pro: true },
              { icon: BarChart2, title: 'Statistics & insights', desc: 'See return rates, top borrowers, most lent items, and trends over time.', color: 'text-purple-500 bg-purple-500/10', pro: true },
              { icon: ImageIcon, title: 'Item photos', desc: 'Attach photos to any item so you can always prove its condition when lent.', color: 'text-pink-500 bg-pink-500/10', pro: true },
              { icon: Users, title: 'Team workspaces', desc: 'Share an inventory with your whole team. Everyone sees what\'s lent, by whom.', color: 'text-indigo-500 bg-indigo-500/10', org: true },
            ].map(({ icon: Icon, title, desc, color, pro, org }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 relative">
                {(pro || org) && (
                  <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full ${org ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                    {org ? 'Org' : 'Pro'}
                  </span>
                )}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-1">Free</p>
                <p className="text-4xl font-bold">€0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground mt-2">Perfect for personal use</p>
              </div>
              <Link href="/register" className="block text-center border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-muted transition-colors mb-6">
                Get started free
              </Link>
              <ul className="space-y-3">
                {['Up to 10 items', 'Up to 25 loans (lifetime)', 'Basic loan tracking', 'Active loans dashboard'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-lg shadow-primary/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-sm font-semibold">Pro</p>
                </div>
                <p className="text-4xl font-bold">€4.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground mt-2">For serious lenders</p>
              </div>
              <Link href="/register" className="block text-center bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity mb-6">
                Start Pro free trial
              </Link>
              <ul className="space-y-3">
                {[
                  'Unlimited items & loans',
                  'Item photo uploads',
                  'Email & in-app reminders',
                  'CSV export',
                  'Borrower contacts book',
                  'Statistics & charts',
                  'Priority ⭐ badge',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Org */}
            <div className="rounded-2xl border border-blue-500/40 bg-card p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-semibold">Org</p>
                </div>
                <p className="text-4xl font-bold">€15<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-sm text-muted-foreground mt-2">from €3/seat · min 5 seats</p>
              </div>
              <Link href="/register" className="block text-center bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors mb-6">
                Set up your team
              </Link>
              <ul className="space-y-3">
                {[
                  'Everything in Pro',
                  'Multi-user shared workspace',
                  'Org admin dashboard',
                  'Cross-member item visibility',
                  'Org-wide loan overview',
                  'Member management & roles',
                  'Join request approval flow',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-blue-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to stop losing track?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join Lend and never have an awkward "did you return my drill?" conversation again.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Lend</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Sign up</Link>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Lend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
