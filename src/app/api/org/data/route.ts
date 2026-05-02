import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', user.id).maybeSingle()
    if (!org) return NextResponse.json({ error: 'Not an org owner' }, { status: 403 })

    const { data: members } = await supabase.from('org_members').select('user_id').eq('org_id', org.id).eq('status', 'active')
    const memberIds = (members ?? []).map(m => m.user_id)

    const [{ data: items }, { data: loans }] = await Promise.all([
      supabase.from('items').select('*, profiles(username, display_name)').in('owner_id', memberIds).eq('is_archived', false).order('created_at', { ascending: false }),
      supabase.from('loans').select('*, items(name, emoji), profiles(username, display_name)').in('owner_id', memberIds).in('status', ['active', 'overdue']).order('due_at', { ascending: true }),
    ])

    return NextResponse.json({ items: items ?? [], loans: loans ?? [], memberCount: memberIds.length })
  } catch (err) {
    console.error('org/data error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
