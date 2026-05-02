'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ActivityEvent {
  id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown>
  loans?: {
    borrower_name: string
    items?: {
      name: string
      emoji: string
    }
  }
}

function eventDescription(event: ActivityEvent): { icon: string; text: string } {
  const itemName = event.loans?.items?.name ?? 'item'
  const borrower = event.loans?.borrower_name ?? 'Someone'

  switch (event.event_type) {
    case 'created':
      return { icon: '📤', text: `Lent ${itemName} to ${borrower}` }
    case 'returned':
      return { icon: '✅', text: `${borrower} returned ${itemName}` }
    case 'extended':
      return { icon: '📅', text: `Extended loan for ${itemName}` }
    case 'lost':
      return { icon: '😞', text: `${itemName} marked as lost` }
    default:
      return { icon: '📋', text: `Event on ${itemName}` }
  }
}

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  async function fetchEvents() {
    const { data } = await supabase
      .from('loan_events')
      .select('*, loans(borrower_name, items(name, emoji))')
      .order('created_at', { ascending: false })
      .limit(10)

    setEvents((data as ActivityEvent[]) ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchEvents()

    const channel = supabase
      .channel('activity-feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loan_events' },
        () => {
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No activity yet. Start lending items to see events here.
      </div>
    )
  }

  return (
    <ScrollArea className="h-full max-h-[480px]">
      <div className="space-y-1">
        {events.map((event) => {
          const { icon, text } = eventDescription(event)
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="text-xl mt-0.5 w-7 text-center shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelative(event.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
