import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

const VALID_CODES: Record<string, { seats: number }> = {
  'FREEBETAORG': { seats: 25 },
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { promoCode, orgName, seatLimit } = await request.json()
    if (!promoCode || !orgName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const promo = VALID_CODES[promoCode.trim().toUpperCase()]
    if (!promo) return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })

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
    if (profile.org_id) return NextResponse.json({ error: 'Already in an organization' }, { status: 400 })

    const seats = seatLimit ?? promo.seats
    const joinCode = generateJoinCode()

    const { data: org, error: orgError } = await supabase.from('organizations').insert({
      name: orgName.trim(),
      owner_id: user.id,
      join_code: joinCode,
      seat_limit: seats,
      plan_activated_at: new Date().toISOString(),
    }).select().single()

    if (orgError || !org) {
      console.error('org insert error:', JSON.stringify(orgError))
      return NextResponse.json({ error: orgError?.message ?? 'Failed to create organization' }, { status: 500 })
    }

    const { error: memberError } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    if (memberError) console.error('org_members insert error:', JSON.stringify(memberError))

    const { error: profileError } = await supabase.from('profiles').update({
      plan: 'org',
      org_id: org.id,
      org_role: 'owner',
      plan_activated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (profileError) {
      console.error('profile update error:', JSON.stringify(profileError))
      return NextResponse.json({ error: profileError.message ?? 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, orgId: org.id, joinCode })
  } catch (err) {
    console.error('redeem-promo error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
