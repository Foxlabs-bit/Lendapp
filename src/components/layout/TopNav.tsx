'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './NotificationBell'
import { Sun, Moon, Search } from 'lucide-react'

interface TopNavProps {
  title?: string
}

export function TopNav({ title }: TopNavProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur sticky top-0 z-20 flex items-center px-6 gap-4">
      {title && <h1 className="font-semibold text-lg flex-1">{title}</h1>}
      {!title && <div className="flex-1" />}
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 text-muted-foreground text-sm"
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
      >
        <Search className="h-4 w-4" />
        Search
        <kbd className="pointer-events-none text-xs bg-muted px-1.5 py-0.5 rounded border">⌘K</kbd>
      </Button>
      <NotificationBell />
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </header>
  )
}
