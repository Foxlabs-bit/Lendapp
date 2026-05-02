import type { Profile } from '@/lib/supabase/types'

export type LimitAction =
  | 'add_item'
  | 'create_loan'
  | 'upload_image'
  | 'set_reminder'
  | 'export_csv'
  | 'view_borrowers'
  | 'view_stats'

export interface LimitResult {
  allowed: boolean
  reason?: string
  upgradeMessage?: string
}

export function checkLimit(profile: Profile, action: LimitAction, currentCount?: number): LimitResult {
  if (profile.plan === 'pro') return { allowed: true }

  switch (action) {
    case 'add_item':
      if (currentCount !== undefined && currentCount >= profile.item_limit) {
        return {
          allowed: false,
          reason: `You've reached your ${profile.item_limit}-item limit`,
          upgradeMessage: 'Upgrade to Pro for unlimited items',
        }
      }
      return { allowed: true }

    case 'create_loan':
      if (currentCount !== undefined && currentCount >= 25) {
        return {
          allowed: false,
          reason: "You've reached your 25 active loans limit",
          upgradeMessage: 'Upgrade to Pro for unlimited loans',
        }
      }
      return { allowed: true }

    case 'upload_image':
      return {
        allowed: false,
        reason: 'Image uploads are a Pro feature',
        upgradeMessage: 'Upgrade to Pro to add photos to your items',
      }

    case 'set_reminder':
      return {
        allowed: false,
        reason: 'Reminders are a Pro feature',
        upgradeMessage: 'Upgrade to Pro to set loan reminders',
      }

    case 'export_csv':
      return {
        allowed: false,
        reason: 'CSV export is a Pro feature',
        upgradeMessage: 'Upgrade to Pro to export your loan history',
      }

    case 'view_borrowers':
      return {
        allowed: false,
        reason: 'Borrower contacts are a Pro feature',
        upgradeMessage: 'Upgrade to Pro to manage your borrower contacts',
      }

    case 'view_stats':
      return {
        allowed: false,
        reason: 'Statistics are a Pro feature',
        upgradeMessage: 'Upgrade to Pro to see detailed loan analytics',
      }

    default:
      return { allowed: true }
  }
}
