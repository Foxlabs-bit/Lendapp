'use client'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export default function Error({ reset }: { error: Error; reset: () => void }) {
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
          <p className="text-8xl font-bold text-muted-foreground/30">500</p>
          <h1 className="text-2xl font-bold mt-2">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">An unexpected error occurred. Try refreshing the page.</p>
        </div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
