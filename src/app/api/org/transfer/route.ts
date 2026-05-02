import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const { newOwnerId } = await request.json()
    if (!newOwnerId) return NextResponse.json({ error: 'Missing newOwnerId' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (newOwnerId === user.id) return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })

    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).maybeSingle()
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    // Verify target is an active member
    const { data: membership } = await supabase.from('org_members').select('id').eq('org_id', org.id).eq('user_id', newOwnerId).eq('status', 'active').maybeSingle()
    if (!membership) return NextResponse.json({ error: 'User is not an active member of your organization' }, { status: 404 })

    // Transfer ownership
    await supabase.from('organizations').update({ owner_id: newOwnerId }).eq('id', org.id)
    await supabase.from('org_members').update({ role: 'owner' }).eq('org_id', org.id).eq('user_id', newOwnerId)
    await supabase.from('org_members').update({ role: 'user' }).eq('org_id', org.id).eq('user_id', user.id)
    await supabase.from('profiles').update({ org_role: 'owner' }).eq('id', newOwnerId)
    await supabase.from('profiles').update({ org_role: 'user' }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('org/transfer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
