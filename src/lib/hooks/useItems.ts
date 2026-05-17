'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Item } from '@/lib/supabase/types'

export function useItems(includeArchived = false) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['items', includeArchived],
    queryFn: async () => {
      let query = supabase.from('items').select('*').order('created_at', { ascending: false })
      if (!includeArchived) query = query.eq('is_archived', false)
      const { data, error } = await query
      if (error) throw error
      return data as Item[]
    },
  })
}

export function useCreateItem() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase.from('items').insert({ ...item, owner_id: user.id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useUpdateItem() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, created_at: _c, owner_id: _o, ...updates }: Partial<Item> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase.from('items').update(updates).eq('id', id).eq('owner_id', user.id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export function useDeleteItem() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('items').delete().eq('id', id).eq('owner_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useItemAvailability(itemId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['item-availability', itemId],
    queryFn: async () => {
      const [{ data: item }, { data: loans }] = await Promise.all([
        supabase.from('items').select('total_quantity').eq('id', itemId).single(),
        supabase.from('loans').select('quantity').eq('item_id', itemId).in('status', ['active', 'overdue']),
      ])
      const activeQty = (loans ?? []).reduce((sum, l) => sum + l.quantity, 0)
      return {
        total: item?.total_quantity ?? 0,
        available: (item?.total_quantity ?? 0) - activeQty,
      }
    },
    enabled: !!itemId,
  })
}
