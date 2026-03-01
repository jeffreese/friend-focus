import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize empty strings and undefined values to null for database storage.
 * Drizzle skips `undefined` values in SET clauses, so we must convert to null
 * to ensure clearing a field actually persists.
 */
export function normalizeEmpty(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' || value === undefined ? null : value,
    ]),
  )
}
