import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function verifySignature(body: string, signature: string | null, sigKey: string): boolean {
  if (!signature || !sigKey) return true
  const hmac = crypto.createHmac('sha256', sigKey)
  hmac.update(body)
  return hmac.digest('base64') === signature
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-square-hmacsha256-signature')
  const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ''

  if (!verifySignature(body, signature, sigKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.type === 'subscription.deactivated') {
    const subscriptionId = event.data?.object?.subscription?.id
    if (subscriptionId) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free', square_subscription_id: null, item_limit: 10 })
        .eq('square_subscription_id', subscriptionId)
    }
  }

  return NextResponse.json({ received: true })
}
