'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUpdateItem, useDeleteItem, useItemAvailability } from '@/lib/hooks/useItems'
import { CATEGORY_COLORS } from '@/lib/utils/formatters'
import type { Item } from '@/lib/supabase/types'

interface ItemCardProps {
  item: Item
  onEdit: (item: Item) => void
  onArchive?: (item: Item) => void
  onDelete?: (item: Item) => void
  onClick?: (item: Item) => void
}

function AvailabilityBadge({ itemId, total }: { itemId: string; total: number }) {
  const { data: avail } = useItemAvailability(itemId)

  if (!avail) return null

  const available = avail.available
  const statusLabel =
    total === 0
      ? 'Archived'
      : available === 0
      ? 'Fully Out'
      : available < total
      ? 'On Loan'
      : 'Available'

  const statusClass =
    statusLabel === 'Available'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : statusLabel === 'On Loan'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : statusLabel === 'Fully Out'
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {available}/{total} available
      </span>
      <Badge className={cn('text-[10px] h-4 px-1.5 border-0', statusClass)}>
        {statusLabel}
      </Badge>
    </div>
  )
}

export function ItemCard({ item, onEdit, onArchive, onDelete, onClick }: ItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()

  async function handleArchiveToggle() {
    if (onArchive) { onArchive(item); return }
    try {
      await updateItem.mutateAsync({ id: item.id, is_archived: !item.is_archived })
      toast.success(item.is_archived ? 'Item restored' : 'Item archived')
    } catch {
      toast.error('Failed to update item')
    }
  }

  async function handleDelete() {
    if (onDelete) { onDelete(item); setShowDeleteConfirm(false); return }
    try {
      await deleteItem.mutateAsync(item.id)
      toast.success(`"${item.name}" deleted`)
      setShowDeleteConfirm(false)
    } catch {
      toast.error('Failed to delete item')
    }
  }

  return (
    <>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {item.name}?</DialogTitle>
            <DialogDescription>
              This will delete all loan history for this item. This action cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card
        className={cn(
          'group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
          item.is_archived && 'opacity-60'
        )}
        onClick={() => onClick?.(item)}
      >
        {/* Image or emoji background */}
        {item.image_url ? (
          <div
            className="h-32 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${item.image_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          </div>
        ) : (
          <div className="h-32 bg-muted/50 flex items-center justify-center text-5xl">
            {item.emoji}
          </div>
        )}

        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight truncate">{item.name}</div>
              <Badge
                className={cn(
                  'mt-1 text-[10px] h-4 px-1.5 border-0',
                  CATEGORY_COLORS[item.category]
                )}
              >
                {item.category}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchiveToggle}>
                  {item.is_archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-2" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <AvailabilityBadge itemId={item.id} total={item.total_quantity} />
        </CardContent>
      </Card>
    </>
  )
}
