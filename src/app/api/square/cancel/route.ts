import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SquareClient, SquareEnvironment } from "square"

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: SquareEnvironment.Sandbox,
})

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('square_subscription_id, plan').eq('id', user.id).single()
    if (!profile || profile.plan === 'free') return NextResponse.json({ error: 'No active subscription' }, { status: 400 })

    if (profile.square_subscription_id) {
      await square.subscriptions.cancel({ subscriptionId: profile.square_subscription_id })
    }

    await supabase.from('profiles').update({
      plan: 'free',
      square_subscription_id: null,
      item_limit: 10,
    }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Cancel error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Cancel failed' }, { status: 500 })
  }
}
