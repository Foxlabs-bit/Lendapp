'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoans } from '@/lib/hooks/useLoans'
import { CATEGORY_COLORS, STATUS_COLORS, formatDate, formatCurrency } from '@/lib/utils/formatters'
import type { Item } from '@/lib/supabase/types'
import { Calendar, DollarSign, Hash, StickyNote, Edit } from 'lucide-react'

interface ItemDetailSheetProps {
  item: Item | null
  open: boolean
  onClose: () => void
  onEdit: (item: Item) => void
}

export function ItemDetailSheet({ item, open, onClose, onEdit }: ItemDetailSheetProps) {
  const { data: allLoans = [], isLoading } = useLoans()
  const itemLoans = allLoans.filter(l => l.item_id === item?.id)
  const activeLoans = itemLoans.filter(l => l.status === 'active' || l.status === 'overdue')
  const loanHistory = itemLoans.filter(l => l.status !== 'active' && l.status !== 'overdue')

  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{item.emoji}</span>
            <div>
              <SheetTitle className="text-xl">{item.name}</SheetTitle>
              <Badge className={`mt-1 text-xs ${CATEGORY_COLORS[item.category]}`}>{item.category}</Badge>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 space-y-5 pb-6">
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Quantity</p>
                <p className="font-semibold">{item.total_quantity} total</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Available</p>
                <p className="font-semibold">{item.total_quantity - activeLoans.reduce((s, l) => s + l.quantity, 0)} of {item.total_quantity}</p>
              </div>
            </div>

            {(item.serial_number || item.purchase_price || item.purchase_date) && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  {item.serial_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-4 w-4 shrink-0" />
                      <span>S/N: {item.serial_number}</span>
                    </div>
                  )}
                  {item.purchase_price && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4 shrink-0" />
                      <span>Purchased for {formatCurrency(item.purchase_price)}</span>
                    </div>
                  )}
                  {item.purchase_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Bought {formatDate(item.purchase_date)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {item.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <StickyNote className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{item.notes}</p>
                </div>
              </>
            )}

            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Active Loans</h3>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : activeLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active loans for this item.</p>
              ) : (
                <div className="space-y-2">
                  {activeLoans.map(loan => (
                    <div key={loan.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{loan.borrower_name}</span>
                        <Badge className={`text-xs ${STATUS_COLORS[loan.status]}`}>{loan.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">Due {formatDate(loan.due_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loanHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Loan History</h3>
                  <div className="space-y-2">
                    {loanHistory.slice(0, 5).map(loan => (
                      <div key={loan.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{loan.borrower_name}</span>
                          <Badge className={`text-xs ${STATUS_COLORS[loan.status]}`}>{loan.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">
                          {formatDate(loan.borrowed_at)} → {loan.returned_at ? formatDate(loan.returned_at) : 'ongoing'}
                        </p>
                        {loan.condition_in && <p className="text-xs mt-1">Returned: {loan.condition_in}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button onClick={() => { onClose(); onEdit(item) }} className="w-full gap-2">
            <Edit className="h-4 w-4" />
            Edit Item
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
