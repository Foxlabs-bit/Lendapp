'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Organization, OrgMemberWithProfile } from '@/lib/supabase/types'

export function useMyOrg() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-org'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('organizations').select('*').eq('owner_id', user.id).maybeSingle()
      return data as Organization | null
    },
  })
}

export function useOrgMembers(orgId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_members')
        .select('*, profiles(*)')
        .eq('org_id', orgId!)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as OrgMemberWithProfile[]
    },
    enabled: !!orgId,
  })
}

export function useOrgPendingRequests(orgId: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['org-pending', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_members')
        .select('*, profiles(*)')
        .eq('org_id', orgId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as OrgMemberWithProfile[]
    },
    enabled: !!orgId,
  })
}

export function useMyOrgMembership() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['org-membership'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle()
      return data
    },
  })
}

export function useApproveOrgMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, approved }: { memberId: string; approved: boolean }) => {
      const res = await fetch('/api/org/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, approved }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-pending'] })
      qc.invalidateQueries({ queryKey: ['org-members'] })
    },
  })
}

export function useRemoveOrgMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/org/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-members'] }),
  })
}

export function useLeaveOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/org/leave', { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-membership'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/org/delete', { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-org'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useTransferOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (newOwnerId: string) => {
      const res = await fetch('/api/org/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-org'] })
      qc.invalidateQueries({ queryKey: ['org-members'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
