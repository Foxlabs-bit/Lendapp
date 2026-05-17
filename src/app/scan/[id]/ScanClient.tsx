'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ScanItem {
  id: string
  name: string
  emoji: string
  image_url: string | null
  category: string
  total_quantity: number
  available: number
  owner_id: string
}

export function ScanClient({ item }: { item: ScanItem }) {
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isAvailable = item.available > 0

  async function handleBorrow(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dueDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/scan/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, borrowerName: name.trim(), dueDate }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to create loan'); return }
      setDone(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Loan logged!</h1>
          <p className="text-muted-foreground">
            <strong>{name}</strong> is now borrowing <strong>{item.name}</strong>. Due back on {new Date(dueDate).toLocaleDateString()}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-6 py-3 flex items-center gap-2">
        <div className="bg-primary rounded-lg p-1.5">
          <Package className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">Lend</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-md space-y-4">
          {/* Item card */}
          <div className="bg-background rounded-2xl border overflow-hidden shadow-sm">
            {item.image_url ? (
              <div className="h-52 relative overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="448px"
                />
              </div>
            ) : (
              <div className="h-52 bg-muted flex items-center justify-center text-7xl">
                {item.emoji}
              </div>
            )}
            <div className="p-5">
              <h1 className="text-xl font-bold">{item.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <Badge variant={isAvailable ? 'default' : 'destructive'} className="text-xs">
                  {isAvailable ? `${item.available} available` : 'Fully out'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Loan form */}
          {isAvailable ? (
            <div className="bg-background rounded-2xl border p-5 shadow-sm">
              <form onSubmit={handleBorrow} className="space-y-4">
                <h2 className="font-semibold text-lg">Borrow this item</h2>
                <div className="space-y-1.5">
                  <Label htmlFor="borrower">Your name</Label>
                  <Input
                    id="borrower"
                    placeholder="e.g. Alex Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due">Return by</Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Borrow
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-background rounded-2xl border p-5 shadow-sm text-center space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">This item is currently fully on loan.</p>
              <p className="text-sm">Check back later or contact the owner.</p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pb-4">Powered by Lend</p>
        </div>
      </div>
    </div>
  )
}
