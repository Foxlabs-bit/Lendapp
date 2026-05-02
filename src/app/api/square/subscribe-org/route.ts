import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SquareClient, SquareEnvironment } from 'square'
import type { Database } from '@/lib/supabase/types'

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
    const { token, orgName, seatLimit } = await request.json()
    if (!token || !orgName || !seatLimit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    const square = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: SquareEnvironment.Sandbox,
    })

    const customerResult = await square.customers.create({
      emailAddress: user.email,
      givenName: profile.display_name ?? profile.username,
      idempotencyKey: `org-customer-${user.id}`,
    })
    const customerId = customerResult.customer?.id
    if (!customerId) return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })

    const cardResult = await square.cards.create({
      idempotencyKey: `org-card-${user.id}-${Date.now()}`,
      sourceId: token,
      card: { customerId },
    })
    const cardId = cardResult.card?.id
    if (!cardId) return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })

    const amountCents = seatLimit * 300
    const paymentResult = await square.payments.create({
      idempotencyKey: `org-payment-${user.id}-${Date.now()}`,
      sourceId: cardId,
      amountMoney: { amount: BigInt(amountCents), currency: 'EUR' },
      customerId,
      note: `Lend Org Plan - ${orgName} - ${seatLimit} seats`,
    })

    const paymentId = paymentResult.payment?.id
    if (!paymentId) return NextResponse.json({ error: 'Payment failed' }, { status: 500 })

    const joinCode = generateJoinCode()

    const { data: org, error: orgError } = await supabase.from('organizations').insert({
      name: orgName.trim(),
      owner_id: user.id,
      join_code: joinCode,
      seat_limit: seatLimit,
      square_customer_id: customerId,
      plan_activated_at: new Date().toISOString(),
    }).select().single()

    if (orgError || !org) return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })

    await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    await supabase.from('profiles').update({
      plan: 'org',
      org_id: org.id,
      org_role: 'owner',
      plan_activated_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json({ success: true, orgId: org.id, joinCode })
  } catch (err) {
    console.error('subscribe-org error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
