import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { CommandPalette } from '@/components/layout/CommandPalette'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <CommandPalette />
      <div className="md:pl-64 pb-16 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  )
}
