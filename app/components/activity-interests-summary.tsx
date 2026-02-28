import { ACTIVITY_RATING_LABELS } from '~/lib/schemas'

const RATING_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
}

interface ActivityInterestsSummaryProps {
  ratings: Array<{
    activityId: string
    rating: number
    activityName: string | null
    activityIcon: string | null
  }>
}

export function ActivityInterestsSummary({
  ratings,
}: ActivityInterestsSummaryProps) {
  // Group by rating value
  const groups = new Map<number, string[]>()
  for (const r of ratings) {
    const existing = groups.get(r.rating) || []
    existing.push(r.activityName || 'Unknown')
    groups.set(r.rating, existing)
  }

  // Render in order 1-5, skip empty groups
  const sortedKeys = [1, 2, 3, 4, 5].filter(k => groups.has(k))

  return (
    <div className="space-y-3">
      {sortedKeys.map(rating => {
        const activities = groups.get(rating)!
        const color = RATING_COLORS[rating]

        return (
          <div key={rating}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-semibold" style={{ color }}>
                {ACTIVITY_RATING_LABELS[rating]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-3.5">
              {activities.map(name => (
                <span
                  key={name}
                  className="px-2 py-0.5 text-xs rounded-full border"
                  style={{
                    color,
                    borderColor: color,
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
