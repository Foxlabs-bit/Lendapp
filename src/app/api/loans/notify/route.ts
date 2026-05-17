import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { sendLoanCreatedEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { loanId } = await request.json()
    if (!loanId) return NextResponse.json({ error: 'Missing loanId' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: loan } = await supabase
      .from('loans')
      .select('*, items(name), borrowers(name, email)')
      .eq('id', loanId)
      .eq('owner_id', user.id)
      .single()

    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    const borrower = loan.borrowers as { name: string; email: string | null } | null
    if (!borrower?.email) return NextResponse.json({ skipped: true })

    const item = loan.items as { name: string } | null
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const ownerName = profile?.full_name ?? 'Someone'

    await sendLoanCreatedEmail({
      to: borrower.email,
      borrowerName: borrower.name,
      itemName: item?.name ?? loan.borrower_name,
      ownerName,
      dueDate: loan.due_at,
      notes: loan.notes,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('notify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
