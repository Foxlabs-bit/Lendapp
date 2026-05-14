'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, Package, HandshakeIcon, Clock, Users,
  BarChart2, Star, LogOut, Settings, Zap, Shield,
} from 'lucide-react'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'Items', icon: Package },
  { href: '/loans', label: 'Active Loans', icon: HandshakeIcon },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/borrowers', label: 'Borrowers', icon: Users, proOnly: true },
  { href: '/stats', label: 'Statistics', icon: BarChart2, proOnly: true },
]

export function Sidebar({ onQuickLend }: { onQuickLend?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: profile } = useProfile()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Signed out')
  }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'org'
  const isOrgOwner = profile?.org_role === 'owner'

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-card fixed left-0 top-0 z-30">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Lend</span>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <Button className="w-full gap-2" onClick={onQuickLend}>
          <Zap className="h-4 w-4" />
          Quick Lend
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, proOnly }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const disabled = proOnly && !isPro

          return (
            <Link
              key={href}
              href={disabled ? '/upgrade' : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                disabled && 'opacity-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {proOnly && !isPro && <Zap className="h-3 w-3 ml-auto text-yellow-500" />}
            </Link>
          )
        })}

        {isOrgOwner && (
          <Link
            href="/org/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/org') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Shield className="h-4 w-4" />
            Org Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t space-y-2">
        {profile?.plan === 'free' && (
          <Link href="/upgrade">
            <Button variant="outline" size="sm" className="w-full gap-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950">
              <Zap className="h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        )}
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {profile?.display_name?.[0] ?? profile?.username?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate flex items-center gap-1">
              {profile?.display_name ?? profile?.username}
              {profile?.plan === 'pro' && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
              {profile?.plan === 'org' && <Shield className="h-3 w-3 text-blue-500" />}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">{profile?.plan}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Link href="/profile" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Profile
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
