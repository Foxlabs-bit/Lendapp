import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

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
    if (userId === user.id) return NextResponse.json({ error: 'Cannot remove yourself as owner' }, { status: 400 })

    await supabase.from('org_members').delete().eq('org_id', org.id).eq('user_id', userId)
    await supabase.from('profiles').update({ org_id: null, org_role: null, plan: 'free' }).eq('id', userId)

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Removed from organization',
      body: `You have been removed from ${org.name}.`,
      type: 'org_removed',
      metadata: { org_id: org.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('org/remove error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
