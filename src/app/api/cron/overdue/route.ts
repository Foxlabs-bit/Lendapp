import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { sendOverdueEmail } from '@/lib/email'

type OverdueLoan = {
  id: string
  due_at: string
  borrower_name: string
  notes: string | null
  owner_id: string
  items: { name: string } | null
  borrowers: { name: string; email: string | null } | null
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  // Fetch all active loans that are past due, with borrower email and item name
  const { data: loansRaw, error } = await supabase
    .from('loans')
    .select('id, due_at, borrower_name, notes, owner_id, items(name), borrowers(name, email)')
    .in('status', ['active', 'overdue'])
    .lt('due_at', today)

  const loans = loansRaw as OverdueLoan[] | null

  if (error) {
    console.error('overdue cron fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark all as overdue
  const ids = (loans ?? []).map(l => l.id)
  if (ids.length > 0) {
    await supabase.from('loans').update({ status: 'overdue' }).in('id', ids).in('status', ['active'])
  }

  // Send emails to borrowers who have an email address
  let emailsSent = 0
  for (const loan of loans ?? []) {
    const borrower = loan.borrowers
    if (!borrower?.email) continue

    const item = loan.items

    // Look up owner name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', loan.owner_id)
      .maybeSingle()

    try {
      await sendOverdueEmail({
        to: borrower.email,
        borrowerName: borrower.name,
        itemName: item?.name ?? loan.borrower_name,
        ownerName: profile?.full_name ?? 'the owner',
        dueDate: loan.due_at,
      })
      emailsSent++
    } catch (err) {
      console.error(`Failed to send overdue email for loan ${loan.id}:`, err)
    }
  }

  return NextResponse.json({
    processed: loans?.length ?? 0,
    markedOverdue: ids.length,
    emailsSent,
  })
}
