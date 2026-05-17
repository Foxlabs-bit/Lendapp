'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Loan, LoanStatus, LoanWithDetails } from '@/lib/supabase/types'

export function useLoans(filters?: { status?: LoanStatus[] }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['loans', filters],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select('*, items(*), borrowers(*)')
        .order('due_at', { ascending: true })

      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error
      return data as LoanWithDetails[]
    },
  })
}

export function useActiveLoans() {
  return useLoans({ status: ['active', 'overdue'] })
}

export function useCreateLoan() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('loans')
        .insert({ ...loan, owner_id: user.id })
        .select('*, items(*), borrowers(*)')
        .single()
      if (error) throw error
      const loanData = data as LoanWithDetails
      await supabase.from('loan_events').insert({
        loan_id: loanData.id,
        owner_id: user.id,
        event_type: 'created',
        metadata: { borrower_name: loan.borrower_name },
      })
      if (loan.borrower_id) {
        const { data: borrower } = await supabase
          .from('borrowers')
          .select('total_loans')
          .eq('id', loan.borrower_id)
          .single()
        if (borrower) {
          await supabase
            .from('borrowers')
            .update({ total_loans: (borrower.total_loans ?? 0) + 1 })
            .eq('id', loan.borrower_id)
        }
      }
      return loanData
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['borrowers'] })
    },
  })
}

export function useReturnLoan() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, condition_in, notes }: { id: string; condition_in?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('loans')
        .update({ status: 'returned', returned_at: today, condition_in, notes })
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()
      if (error) throw error
      if (user) {
        await supabase.from('loan_events').insert({
          loan_id: id,
          owner_id: user.id,
          event_type: 'returned',
          metadata: { condition_in },
        })
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useExtendLoan() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, due_at }: { id: string; due_at: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('loans')
        .update({ due_at, status: 'active' })
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()
      if (error) throw error
      if (user) {
        await supabase.from('loan_events').insert({
          loan_id: id,
          owner_id: user.id,
          event_type: 'extended',
          metadata: { new_due_at: due_at },
        })
      }
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  })
}

export function useMarkLost() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('loans')
        .update({ status: 'lost' })
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()
      if (error) throw error
      if (user) {
        await supabase.from('loan_events').insert({
          loan_id: id,
          owner_id: user.id,
          event_type: 'lost',
          metadata: {},
        })
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useLoanEvents(loanId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['loan-events', loanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_events')
        .select('*')
        .eq('loan_id', loanId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!loanId,
  })
}
