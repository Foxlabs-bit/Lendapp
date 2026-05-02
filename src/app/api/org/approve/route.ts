import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const { memberId, approved } = await request.json()
    if (!memberId || approved === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

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

    const { data: member } = await supabase.from('org_members').select('*').eq('id', memberId).eq('org_id', org.id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    if (approved) {
      await supabase.from('org_members').update({ status: 'active', joined_at: new Date().toISOString() }).eq('id', memberId)
      await supabase.from('profiles').update({ org_id: org.id, org_role: 'user', plan: 'org' }).eq('id', member.user_id)
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        title: '✅ Join request approved',
        body: `You've been approved to join ${org.name}!`,
        type: 'org_approved',
        metadata: { org_id: org.id },
      })
    } else {
      await supabase.from('org_members').delete().eq('id', memberId)
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        title: '❌ Join request denied',
        body: `Your request to join ${org.name} was not approved.`,
        type: 'org_denied',
        metadata: { org_id: org.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('org/approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
