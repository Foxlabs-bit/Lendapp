import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { itemId, borrowerName, dueDate } = await request.json()
    if (!itemId || !borrowerName?.trim() || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: item } = await supabase
      .from('items')
      .select('id, owner_id, total_quantity, is_archived')
      .eq('id', itemId)
      .single()

    if (!item || item.is_archived) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const { count: activeCount } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
      .in('status', ['active', 'overdue'])

    if ((activeCount ?? 0) >= item.total_quantity) {
      return NextResponse.json({ error: 'Item is fully on loan' }, { status: 409 })
    }

    const { error } = await supabase.from('loans').insert({
      owner_id: item.owner_id,
      item_id: itemId,
      borrower_name: borrowerName.trim(),
      due_at: dueDate,
      status: 'active',
      quantity: 1,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
