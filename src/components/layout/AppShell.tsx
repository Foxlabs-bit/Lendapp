'use client'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { CommandPalette } from './CommandPalette'
import { QuickLendModal } from '@/components/loans/QuickLendModal'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onQuickLend={() => setQuickOpen(true)} />
      <CommandPalette />
      <div className="md:pl-64 pb-16 md:pb-0">
        {children}
      </div>
      <MobileNav />

      {/* Mobile FAB */}
      <Button
        onClick={() => setQuickOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 shadow-xl"
        size="icon"
      >
        <Zap className="h-6 w-6" />
      </Button>

      <QuickLendModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  )
}
