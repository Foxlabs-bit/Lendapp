import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { polar, ORG_PRODUCT_IDS } from '@/lib/polar'
import type { Database } from '@/lib/supabase/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const { type, orgName, seatLimit } = await request.json()
    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan, email').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.plan !== 'free') return NextResponse.json({ error: 'Already on a paid plan' }, { status: 400 })

    if (type === 'pro') {
      const productId = process.env.POLAR_PRO_PRODUCT_ID
      if (!productId) return NextResponse.json({ error: 'Pro plan not configured' }, { status: 500 })

      const checkout = await polar.checkouts.create({
        products: [productId],
        customerEmail: profile.email,
        successUrl: `${APP_URL}/upgrade?success=pro`,
        metadata: { userId: user.id, type: 'pro' },
      })

      return NextResponse.json({ url: checkout.url })
    }

    if (type === 'org') {
      if (!orgName?.trim() || !seatLimit) return NextResponse.json({ error: 'Missing org name or seat count' }, { status: 400 })
      const productId = ORG_PRODUCT_IDS[seatLimit as number]
      if (!productId) return NextResponse.json({ error: `No product configured for ${seatLimit} seats` }, { status: 400 })

      const checkout = await polar.checkouts.create({
        products: [productId],
        customerEmail: profile.email,
        successUrl: `${APP_URL}/upgrade?success=org`,
        metadata: { userId: user.id, type: 'org', orgName: orgName.trim(), seatLimit },
      })

      return NextResponse.json({ url: checkout.url })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('polar/checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
