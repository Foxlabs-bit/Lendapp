'use client'
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemTable } from '@/components/items/ItemTable'
import { ItemDetailSheet } from '@/components/items/ItemDetailSheet'
import { AddItemModal } from '@/components/items/AddItemModal'
import { UpgradeModal } from '@/components/upgrade/UpgradeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useItems, useUpdateItem, useDeleteItem } from '@/lib/hooks/useItems'
import { useProfile } from '@/lib/hooks/useProfile'
import { usePlan } from '@/lib/hooks/usePlan'
import { ITEM_CATEGORIES } from '@/lib/utils/formatters'
import type { Item, ItemCategory } from '@/lib/supabase/types'
import { Plus, LayoutGrid, List, Package } from 'lucide-react'
import { toast } from 'sonner'

function ItemsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'availability'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showArchived, setShowArchived] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [detailItem, setDetailItem] = useState<Item | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeContext, setUpgradeContext] = useState('')

  const { data: items = [], isLoading } = useItems(showArchived)
  const { data: profile } = useProfile()
  const { isFree, itemLimit, check } = usePlan()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()

  const handleAddClick = useCallback(() => {
    const result = check('add_item', items.filter(i => !i.is_archived).length)
    if (!result.allowed) {
      setUpgradeContext(result.reason ?? '')
      setUpgradeOpen(true)
      return
    }
    setAddOpen(true)
  }, [check, items])

  useEffect(() => {
    if (searchParams.get('add') === 'true' && !isLoading && profile !== undefined) {
      handleAddClick()
      router.replace('/items')
    }
  }, [searchParams, isLoading, profile, handleAddClick, router])

  const filtered = useMemo(() => {
    let list = items
    if (!showArchived) list = list.filter(i => !i.is_archived)
    if (search) list = list.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase())
    )
    if (categoryFilter !== 'all') list = list.filter(i => i.category === categoryFilter)
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'date') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [items, search, categoryFilter, sortBy, showArchived])

  async function handleArchive(item: Item) {
    await updateItem.mutateAsync({ id: item.id, is_archived: !item.is_archived })
    toast.success(item.is_archived ? 'Item unarchived' : 'Item archived')
  }

  async function handleDelete(item: Item) {
    await deleteItem.mutateAsync(item.id)
    setDeleteConfirm(null)
    toast.success('Item deleted')
  }

  const nonArchivedCount = items.filter(i => !i.is_archived).length

  return (
    <>
      <TopNav title="Items Library" />
      <div className="p-6 max-w-7xl mx-auto">
        {isFree && (
          <div className="mb-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{nonArchivedCount}/{itemLimit} items used</span>
              <span className="text-muted-foreground">{itemLimit - nonArchivedCount} remaining</span>
            </div>
            <Progress value={(nonArchivedCount / itemLimit) * 100} className="h-2" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="availability">Availability</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 text-sm">
              <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
              <Label htmlFor="archived" className="text-muted-foreground cursor-pointer">Show archived</Label>
            </div>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No items yet</p>
            <p className="text-sm mb-6">Add your first item to start tracking what you lend.</p>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="h-4 w-4" /> Add your first item
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={setEditItem}
                onArchive={handleArchive}
                onDelete={setDeleteConfirm}
                onClick={setDetailItem}
              />
            ))}
          </div>
        ) : (
          <ItemTable
            items={filtered}
            onEdit={setEditItem}
            onArchive={handleArchive}
            onDelete={setDeleteConfirm}
            onClick={setDetailItem}
          />
        )}
      </div>

      <AddItemModal open={addOpen || !!editItem} onClose={() => { setAddOpen(false); setEditItem(null) }} editItem={editItem} />
      <ItemDetailSheet item={detailItem} open={!!detailItem} onClose={() => setDetailItem(null)} onEdit={setEditItem} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} limitContext={upgradeContext} />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteConfirm?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the item and all its loan history. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ItemsPage() {
  return <Suspense><ItemsContent /></Suspense>
}
