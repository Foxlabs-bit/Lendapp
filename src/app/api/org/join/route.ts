import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const { joinCode } = await request.json()
    if (!joinCode) return NextResponse.json({ error: 'Join code required' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.org_id) return NextResponse.json({ error: 'You are already in an organization' }, { status: 400 })

    const { data: org } = await supabase.from('organizations').select('*').eq('join_code', joinCode.trim().toUpperCase()).maybeSingle()
    if (!org) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

    const { data: activeMembers } = await supabase.from('org_members').select('id').eq('org_id', org.id).eq('status', 'active')
    if ((activeMembers?.length ?? 0) >= org.seat_limit) {
      return NextResponse.json({ error: 'This organization has reached its seat limit' }, { status: 400 })
    }

    const { data: existing } = await supabase.from('org_members').select('id, status').eq('org_id', org.id).eq('user_id', user.id).maybeSingle()
    if (existing) {
      if (existing.status === 'pending') return NextResponse.json({ error: 'You already have a pending request for this organization' }, { status: 400 })
      if (existing.status === 'active') return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 })
    }

    await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'user',
      status: 'pending',
    })

    await supabase.from('notifications').insert({
      user_id: org.owner_id,
      title: '👋 New join request',
      body: `${profile.display_name ?? profile.username} wants to join ${org.name}`,
      type: 'org_join_request',
      metadata: { org_id: org.id, requester_id: user.id, requester_name: profile.display_name ?? profile.username },
    })

    return NextResponse.json({ success: true, orgName: org.name })
  } catch (err) {
    console.error('org/join error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
