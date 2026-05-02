import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import type { ItemCategory, LoanStatus } from '@/lib/supabase/types'

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(dueAt: string) {
  return isBefore(new Date(dueAt), new Date())
}

export function isDueSoon(dueAt: string, days = 3) {
  const due = new Date(dueAt)
  return isAfter(due, new Date()) && isBefore(due, addDays(new Date(), days))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export const STATUS_COLORS: Record<LoanStatus, string> = {
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  returned: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  lost: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  Electronics: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Tools: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Books: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Clothing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Kitchen: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Office: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics', 'Tools', 'Books', 'Clothing', 'Sports', 'Kitchen', 'Office', 'Other',
]

export const EMOJI_OPTIONS = [
  '📦', '📱', '💻', '⌚', '🎮', '📷', '🎵', '📚', '🔧', '🔨', '🪛', '⚙️',
  '🏀', '⚽', '🎾', '🎿', '🚴', '🧢', '👗', '👟', '🍳', '☕', '🥘', '🔪',
  '📂', '✂️', '🖥️', '🖨️', '⌨️', '🖱️', '📺', '🎸', '🎹', '🎺', '🧲', '💡',
  '🪴', '🎒', '🧳', '🪜',
]
