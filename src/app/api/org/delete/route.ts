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

    const { data: org } = await supabase.from('organizations').select('id, name').eq('owner_id', user.id).maybeSingle()
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    // Reset all members' profiles before deleting org
    const { data: members } = await supabase.from('org_members').select('user_id').eq('org_id', org.id)
    if (members?.length) {
      const memberIds = members.map(m => m.user_id)
      await supabase.from('profiles').update({ org_id: null, org_role: null, plan: 'free' }).in('id', memberIds)
    }

    // Reset owner's profile
    await supabase.from('profiles').update({ org_id: null, org_role: null, plan: 'free' }).eq('id', user.id)

    // Delete org (cascades to org_members)
    const { error } = await supabase.from('organizations').delete().eq('id', org.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('org/delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
