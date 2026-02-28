/**
 * Format a birthday string (YYYY-MM-DD) for display.
 *
 * If the year is 1900 (unknown), shows only month and day: "November 30"
 * Otherwise shows full US format: "November 30, 1995"
 */
export function formatBirthday(dateStr: string): string {
  if (!dateStr) return dateStr
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
      return dateStr
    const date = new Date(year, month - 1, day)

    if (year === 1900) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      })
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Format a date string (YYYY-MM-DD) for display: "Jan 15, 2026"
 */
export function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
      return dateStr
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Format a timestamp as a relative date: "2 days ago", "just now", etc.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return formatDate(d.toISOString().split('T')[0])
}

/** Compute birthdays happening in the next N days */
export function computeUpcomingBirthdays(
  friends: { id: string; name: string; birthday: string | null }[],
  withinDays = 30,
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const results: {
    id: string
    name: string
    birthday: string
    daysUntil: number
  }[] = []

  for (const f of friends) {
    if (!f.birthday) continue
    const parts = f.birthday.split('-').map(Number)
    if (parts.length < 3) continue
    const [, month, day] = parts

    const thisYear = new Date(today.getFullYear(), month - 1, day)
    const nextYear = new Date(today.getFullYear() + 1, month - 1, day)

    const upcoming = thisYear >= today ? thisYear : nextYear
    const diffMs = upcoming.getTime() - today.getTime()
    const daysUntil = Math.floor(diffMs / 86400000)

    if (daysUntil <= withinDays) {
      results.push({
        id: f.id,
        name: f.name,
        birthday: f.birthday,
        daysUntil,
      })
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil)
}
