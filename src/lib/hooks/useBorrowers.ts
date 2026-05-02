'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Borrower } from '@/lib/supabase/types'

export function useBorrowers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['borrowers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('borrowers')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Borrower[]
    },
  })
}

export function useCreateBorrower() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (b: Omit<Borrower, 'id' | 'created_at' | 'owner_id' | 'total_loans'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('borrowers')
        .insert({ ...b, owner_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['borrowers'] }),
  })
}

export function useUpdateBorrower() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, created_at: _c, owner_id: _o, ...updates }: Partial<Borrower> & { id: string }) => {
      const { data, error } = await supabase.from('borrowers').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['borrowers'] }),
  })
}

export function useDeleteBorrower() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('borrowers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['borrowers'] }),
  })
}
