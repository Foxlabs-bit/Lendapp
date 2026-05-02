'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CATEGORY_COLORS } from '@/lib/utils/formatters'
import type { Item } from '@/lib/supabase/types'
import { MoreHorizontal, Edit, Archive, Trash2 } from 'lucide-react'

interface ItemTableProps {
  items: Item[]
  onEdit: (item: Item) => void
  onArchive: (item: Item) => void
  onDelete: (item: Item) => void
  onClick: (item: Item) => void
}

export function ItemTable({ items, onEdit, onArchive, onDelete, onClick }: ItemTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No items found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-center">Available</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow
              key={item.id}
              className={`cursor-pointer hover:bg-muted/50 ${item.is_archived ? 'opacity-50' : ''}`}
              onClick={() => onClick(item)}
            >
              <TableCell className="text-2xl">{item.emoji}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Badge className={`text-xs ${CATEGORY_COLORS[item.category]}`}>{item.category}</Badge>
              </TableCell>
              <TableCell className="text-center">{item.total_quantity}</TableCell>
              <TableCell className="text-center">
                <span className="text-sm">{item.total_quantity}</span>
              </TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                      <Edit className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(item)} className="gap-2">
                      <Archive className="h-4 w-4" /> {item.is_archived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(item)} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
