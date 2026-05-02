import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SquareClient, SquareEnvironment } from 'square'

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: SquareEnvironment.Sandbox,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Missing payment token' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let customerId = profile.square_customer_id

    if (!customerId) {
      const customerResult = await square.customers.create({
        emailAddress: profile.email,
        givenName: profile.display_name ?? profile.username,
        idempotencyKey: `customer-${user.id}`,
      })
      customerId = customerResult.customer?.id ?? null
      if (!customerId) throw new Error('Failed to create Square customer')
    }

    const cardResult = await square.cards.create({
      idempotencyKey: `card-${user.id}-${Date.now()}`,
      sourceId: token,
      card: { customerId },
    })
    const cardId = cardResult.card?.id
    if (!cardId) throw new Error('Failed to save card')

    const planId = process.env.SQUARE_PRO_PLAN_ID
    if (!planId) return NextResponse.json({ error: 'Plan not configured' }, { status: 500 })

    const subResult = await square.subscriptions.create({
      idempotencyKey: `sub-${user.id}-${Date.now()}`,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      planVariationId: planId,
      customerId,
      cardId,
      startDate: new Date().toISOString().split('T')[0],
    })

    const subscriptionId = subResult.subscription?.id
    if (!subscriptionId) throw new Error('Failed to create subscription')

    await supabase.from('profiles').update({
      plan: 'pro',
      square_customer_id: customerId,
      square_subscription_id: subscriptionId,
      plan_activated_at: new Date().toISOString(),
      item_limit: 999999,
    }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment failed' }, { status: 500 })
  }
}
