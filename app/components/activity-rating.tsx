import { useState } from 'react'
import { ACTIVITY_RATING_LABELS } from '~/lib/schemas'

const RATING_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
}

interface ActivityRatingProps {
  activityId: string
  activityName: string
  defaultRating?: number | null
  readOnly?: boolean
}

export function ActivityRating({
  activityId,
  activityName,
  defaultRating,
  readOnly = false,
}: ActivityRatingProps) {
  const [rating, setRating] = useState<number | null>(defaultRating ?? null)

  function handleClick(value: number) {
    if (readOnly) return
    setRating(rating === value ? null : value)
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm font-medium w-28 shrink-0 truncate">
        {activityName}
      </span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(value => {
          const isActive = rating === value
          return (
            <button
              key={value}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(value)}
              title={ACTIVITY_RATING_LABELS[value]}
              className="px-2 py-1 text-xs rounded-md border transition-colors disabled:cursor-default"
              style={
                isActive
                  ? {
                      backgroundColor: RATING_COLORS[value],
                      color: 'white',
                      borderColor: RATING_COLORS[value],
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: 'hsl(var(--border))',
                    }
              }
            >
              {value}
            </button>
          )
        })}
        {rating && (
          <span
            className="text-xs ml-1.5"
            style={{ color: RATING_COLORS[rating] }}
          >
            {ACTIVITY_RATING_LABELS[rating]}
          </span>
        )}
      </div>
      {!readOnly && (
        <input
          type="hidden"
          name={`rating-${activityId}`}
          value={rating ?? ''}
        />
      )}
    </div>
  )
}
