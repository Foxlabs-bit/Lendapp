import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { polar } from '@/lib/polar'
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

    const { data: profile } = await supabase.from('profiles').select('plan, square_subscription_id').eq('id', user.id).single()
    if (!profile || profile.plan === 'free') return NextResponse.json({ error: 'No active subscription' }, { status: 400 })

    // Cancel with Polar if there's a subscription ID (paid plan, not promo)
    if (profile.square_subscription_id) {
      try {
        await polar.subscriptions.revoke({ id: profile.square_subscription_id })
      } catch (err) {
        console.error('Polar cancel error:', err)
      }
    }

    await supabase.from('profiles').update({
      plan: 'free',
      square_subscription_id: null,
      item_limit: 10,
    }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('polar/cancel error:', err)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
