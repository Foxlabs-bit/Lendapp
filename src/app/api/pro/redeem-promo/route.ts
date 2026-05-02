import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

const VALID_CODES = new Set(['FREEBETAPRO'])

export async function POST(request: Request) {
  try {
    const { promoCode } = await request.json()
    if (!promoCode) return NextResponse.json({ error: 'Missing promo code' }, { status: 400 })
    if (!VALID_CODES.has(promoCode.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.plan !== 'free') return NextResponse.json({ error: 'Already on a paid plan' }, { status: 400 })

    const { error } = await supabase.from('profiles').update({
      plan: 'pro',
      plan_activated_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('pro/redeem-promo error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
