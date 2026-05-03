import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-primary rounded-xl p-2">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Lend</span>
        </div>
        <div>
          <p className="text-8xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-2xl font-bold mt-2">Page not found</h1>
          <p className="text-muted-foreground mt-2">This page doesn&apos;t exist or was moved.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
