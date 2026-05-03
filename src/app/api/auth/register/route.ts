import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const { userId, email, username } = await request.json()
    if (!userId || !email || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      username,
      plan: 'free',
      item_limit: 10,
    })

    if (error) {
      console.error('profile create error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('auth/register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
