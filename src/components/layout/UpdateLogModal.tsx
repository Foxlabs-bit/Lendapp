'use client'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { CURRENT_VERSION, CHANGELOG } from '@/lib/changelog'

const STORAGE_KEY = 'lend_seen_version'

export function UpdateLogModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen !== CURRENT_VERSION) setOpen(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    setOpen(false)
  }

  if (!open) return null

  const latest = CHANGELOG[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 p-5 border-b">
          <div className="bg-primary rounded-lg p-1.5">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">What&apos;s new in Lend</h2>
            <p className="text-xs text-muted-foreground">v{latest.version} · {latest.date}</p>
          </div>
        </div>

        {/* Changes */}
        <div className="p-5 space-y-2">
          {latest.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="text-primary mt-0.5 shrink-0">✦</span>
              <span>{change}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={dismiss}
            className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
