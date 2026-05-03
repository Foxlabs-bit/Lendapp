import { Webhooks } from '@polar-sh/nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Subscription activated
    if (payload.type === 'subscription.created' || payload.type === 'subscription.active') {
      const sub = payload.data as {
        id: string
        metadata?: Record<string, unknown>
        product?: { id: string }
        productId?: string
      }

      const meta = sub.metadata ?? {}
      const userId = meta.userId as string | undefined
      if (!userId) return

      const type = meta.type as string | undefined

      if (type === 'pro') {
        await supabase.from('profiles').update({
          plan: 'pro',
          square_subscription_id: sub.id,
          plan_activated_at: new Date().toISOString(),
          item_limit: 999999,
        }).eq('id', userId)
      }

      if (type === 'org') {
        const orgName = meta.orgName as string | undefined
        const seatLimit = meta.seatLimit as number | undefined
        if (!orgName || !seatLimit) return

        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', userId).single()
        if (profile?.org_id) return // already in an org

        const joinCode = generateJoinCode()
        const { data: org, error: orgError } = await supabase.from('organizations').insert({
          name: orgName,
          owner_id: userId,
          join_code: joinCode,
          seat_limit: seatLimit,
          plan_activated_at: new Date().toISOString(),
        }).select().single()

        if (orgError || !org) {
          console.error('Org creation error:', JSON.stringify(orgError))
          return
        }

        await supabase.from('org_members').insert({
          org_id: org.id,
          user_id: userId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        })

        await supabase.from('profiles').update({
          plan: 'org',
          org_id: org.id,
          org_role: 'owner',
          square_subscription_id: sub.id,
          plan_activated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }

    // Subscription cancelled/revoked — downgrade to free
    if (payload.type === 'subscription.canceled' || payload.type === 'subscription.revoked') {
      const sub = payload.data as { id: string }

      await supabase.from('profiles').update({
        plan: 'free',
        square_subscription_id: null,
        item_limit: 10,
      }).eq('square_subscription_id', sub.id)
    }
  },
})
