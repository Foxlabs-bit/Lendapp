'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  Package, Check, Zap, Star, Shield, Users, Bell, BarChart2,
  BookUser, ImageIcon, ArrowRight, HandshakeIcon, QrCode, Mail,
} from 'lucide-react'

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="text-center">
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: 'backOut' }}
        className="text-4xl font-bold text-white mb-1"
      >
        {value}
      </motion.p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  )
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -60])

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 20))
    return unsub
  }, [scrollY])

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glow orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/8 bg-[#080808]/90 backdrop-blur-xl' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-violet-600 rounded-xl p-1.5">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base">Lend</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-sm text-white/50">
            <a href="#features" className="px-3 py-2 hover:text-white transition-colors rounded-lg hover:bg-white/5">Features</a>
            <a href="#pricing" className="px-3 py-2 hover:text-white transition-colors rounded-lg hover:bg-white/5">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-white/90 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 text-center" ref={heroRef}>
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            v1.3 — Now with borrower email notifications
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Never forget<br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-500 bg-clip-text text-transparent">
              who has your stuff
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Lend tracks everything you loan out — items, borrowers, due dates, and reminders — so nothing goes missing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/register" className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#pricing" className="flex items-center justify-center gap-2 border border-white/10 bg-white/5 px-6 py-3 rounded-xl font-medium text-sm hover:bg-white/10 transition-all">
              See pricing
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-white/30 mt-4"
          >
            Free plan · No credit card required
          </motion.p>
        </motion.div>

        {/* Mock dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-white/8 bg-[#111] shadow-2xl shadow-black/60 overflow-hidden">
            <div className="border-b border-white/8 px-4 py-3 flex items-center gap-2 bg-[#0d0d0d]">
              <div className="h-3 w-3 rounded-full bg-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/50" />
              <span className="mx-auto text-xs text-white/20 font-mono">lend.app/dashboard</span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active loans', value: '12', color: 'text-violet-400' },
                { label: 'Items tracked', value: '34', color: 'text-emerald-400' },
                { label: 'Overdue', value: '2', color: 'text-red-400' },
                { label: 'Returned', value: '8', color: 'text-blue-400' },
              ].map(({ label, value, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="rounded-xl border border-white/6 bg-white/[0.03] p-4"
                >
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-white/30 mt-1">{label}</p>
                </motion.div>
              ))}
            </div>
            <div className="px-5 pb-5 space-y-2">
              {[
                { emoji: '🔧', name: 'Drill Machine', borrower: 'Alex K.', due: 'Due in 2 days', status: 'soon' },
                { emoji: '📚', name: 'Clean Code', borrower: 'Maria S.', due: 'Overdue 3 days', status: 'overdue' },
                { emoji: '🎮', name: 'PS5 Controller', borrower: 'Tom B.', due: 'Due in 2 weeks', status: 'ok' },
              ].map(({ emoji, name, borrower, due, status }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white/90">{name}</p>
                    <p className="text-xs text-white/30">→ {borrower}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                    status === 'soon' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-emerald-500/15 text-emerald-400'
                  }`}>{due}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <AnimatedStat value="10k+" label="Loans tracked" />
          <AnimatedStat value="3k+" label="Items catalogued" />
          <AnimatedStat value="98%" label="Return rate" />
          <AnimatedStat value="0" label="Lost items" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and running in 60 seconds</h2>
            <p className="text-white/40 text-lg">No spreadsheets. No sticky notes. Just Lend.</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Package, title: 'Add your items', desc: 'Build a library of anything — tools, books, gear. Takes 30 seconds per item.' },
              { step: '02', icon: Zap, title: 'Log a loan', desc: 'Quick Lend lets you log any loan in seconds. Item, borrower, return date — done.' },
              { step: '03', icon: Bell, title: 'Automatic reminders', desc: 'Borrowers get an email when you log it, and another if they go overdue.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <FadeIn key={step} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-white/16 hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-xs font-mono text-white/20 mt-1">{step}</span>
                    <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to lend with confidence</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">From your first item to managing a whole team&apos;s inventory.</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: HandshakeIcon, title: 'Loan tracking', desc: 'Log who borrowed what, when it\'s due, and its full history.', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Bell, title: 'Smart reminders', desc: 'Automatic emails before loans go overdue. No more chasing people.', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', pro: true },
              { icon: BookUser, title: 'Borrower contacts', desc: 'Build a contact book with loan history and email for every borrower.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', pro: true },
              { icon: BarChart2, title: 'Statistics', desc: 'Return rates, top borrowers, most lent items, and trends over time.', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', pro: true },
              { icon: ImageIcon, title: 'Item photos', desc: 'Attach photos to any item to document condition when lent.', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', pro: true },
              { icon: QrCode, title: 'QR scan to borrow', desc: 'Print a QR code. Anyone scans it to log a loan — no account needed.', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', pro: true },
              { icon: Mail, title: 'Email notifications', desc: 'Borrowers get confirmation emails and overdue reminders automatically.', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', pro: true },
              { icon: Users, title: 'Team workspaces', desc: 'Shared inventory for your whole team. Everyone sees what\'s out.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', org: true },
            ].map(({ icon: Icon, title, desc, color, pro, org }, i) => (
              <FadeIn key={title} delay={i * 0.05}>
                <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-white/14 hover:bg-white/[0.035] transition-all duration-300 h-full">
                  {(pro || org) && (
                    <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${org ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {org ? 'Org' : 'Pro'}
                    </span>
                  )}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border mb-4 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold mb-2 text-white/90">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/40 text-lg">Start free. Upgrade when you need more.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-white/14 transition-all duration-300">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white/40 mb-1">Free</p>
                  <p className="text-4xl font-bold">€0<span className="text-base font-normal text-white/30">/mo</span></p>
                  <p className="text-sm text-white/30 mt-2">Perfect for personal use</p>
                </div>
                <Link href="/register" className="block text-center border border-white/10 bg-white/5 rounded-xl py-2.5 text-sm font-medium hover:bg-white/10 transition-colors mb-6">
                  Get started free
                </Link>
                <ul className="space-y-3">
                  {['Up to 10 items', 'Up to 25 loans (lifetime)', 'Basic loan tracking', 'Active loans dashboard'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/40">
                      <Check className="h-3.5 w-3.5 text-white/20 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Pro */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-violet-500/40 bg-violet-500/[0.06] p-6 shadow-lg shadow-violet-500/10 relative hover:border-violet-500/60 transition-all duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <p className="text-sm font-semibold">Pro</p>
                  </div>
                  <p className="text-4xl font-bold">€4.99<span className="text-base font-normal text-white/30">/mo</span></p>
                  <p className="text-sm text-white/30 mt-2">For serious lenders</p>
                </div>
                <Link href="/register" className="block text-center bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-500 transition-colors mb-6">
                  Start Pro free trial
                </Link>
                <ul className="space-y-3">
                  {['Unlimited items & loans', 'Item photo uploads', 'Email & in-app reminders', 'CSV export', 'Borrower contacts book', 'Statistics & charts', 'QR scan-to-borrow'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Org */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/[0.04] p-6 hover:border-blue-500/50 transition-all duration-300">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-sm font-semibold">Org</p>
                  </div>
                  <p className="text-4xl font-bold">€15<span className="text-base font-normal text-white/30">/mo</span></p>
                  <p className="text-sm text-white/30 mt-2">from €3/seat · min 5 seats</p>
                </div>
                <Link href="/register" className="block text-center bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-500 transition-colors mb-6">
                  Set up your team
                </Link>
                <ul className="space-y-3">
                  {['Everything in Pro', 'Multi-user shared workspace', 'Org admin dashboard', 'Cross-member item visibility', 'Member management & roles'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none" />
        <FadeIn className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to stop losing track?</h2>
          <p className="text-white/40 text-lg mb-8">Never have an awkward &ldquo;did you return my drill?&rdquo; conversation again.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/90 transition-all shadow-lg shadow-white/10">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 rounded-lg p-1.5">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Lend</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign up</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Lend</p>
        </div>
      </footer>
    </div>
  )
}
