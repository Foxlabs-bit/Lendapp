import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Not in an organization' }, { status: 400 })
    if (profile.org_role === 'owner') return NextResponse.json({ error: 'Owners cannot leave — delete the organization instead' }, { status: 400 })

    await supabase.from('org_members').delete().eq('org_id', profile.org_id).eq('user_id', user.id)
    await supabase.from('profiles').update({ org_id: null, org_role: null, plan: 'free' }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('org/leave error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
