'use client'
import { useProfile } from './useProfile'
import { checkLimit, type LimitAction } from '@/lib/utils/planLimits'

export function usePlan() {
  const { data: profile } = useProfile()

  return {
    plan: profile?.plan ?? 'free',
    isPro: profile?.plan === 'pro',
    isFree: !profile || profile.plan === 'free',
    itemLimit: profile?.item_limit ?? 10,
    check: (action: LimitAction, currentCount?: number) =>
      profile ? checkLimit(profile, action, currentCount) : { allowed: false, reason: 'Not loaded' },
  }
}
