'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useItems } from '@/lib/hooks/useItems'
import { useLoans } from '@/lib/hooks/useLoans'
import { Package, HandshakeIcon, Clock } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { data: items = [] } = useItems()
  const { data: loans = [] } = useLoans()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function navigate(path: string) {
    setOpen(false)
    router.push(path)
  }

  const recentLoans = loans.filter(l => l.status === 'active').slice(0, 3)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-lg">
        <Command className="rounded-lg">
          <CommandInput placeholder="Search items, loans, borrowers..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {recentLoans.length > 0 && (
              <CommandGroup heading="Recent Active Loans">
                {recentLoans.map(loan => (
                  <CommandItem key={loan.id} onSelect={() => navigate('/loans')} className="gap-2">
                    <HandshakeIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{loan.items?.emoji} {loan.items?.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">→ {loan.borrower_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Items">
              {items.slice(0, 6).map(item => (
                <CommandItem key={item.id} onSelect={() => navigate('/items')} className="gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{item.emoji} {item.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{item.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Navigation">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Items Library', path: '/items' },
                { label: 'Active Loans', path: '/loans' },
                { label: 'History', path: '/history' },
                { label: 'Statistics', path: '/stats' },
              ].map(item => (
                <CommandItem key={item.path} onSelect={() => navigate(item.path)} className="gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
