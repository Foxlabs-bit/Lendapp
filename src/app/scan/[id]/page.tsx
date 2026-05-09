import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'
import { ScanClient } from './ScanClient'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: item } = await supabase
    .from('items')
    .select('id, name, emoji, image_url, category, total_quantity, is_archived, owner_id')
    .eq('id', id)
    .single()

  if (!item || item.is_archived) notFound()

  const { count: activeCount } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', id)
    .in('status', ['active', 'overdue'])

  const available = item.total_quantity - (activeCount ?? 0)

  return <ScanClient item={{ ...item, available }} />
}
