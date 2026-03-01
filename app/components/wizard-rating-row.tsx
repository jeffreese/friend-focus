import { useFetcher } from 'react-router'
import { Avatar } from '~/components/ui/avatar'
import { ACTIVITY_RATING_LABELS, RATING_COLORS } from '~/lib/schemas'
import { cn } from '~/lib/utils'

interface WizardRatingRowProps {
  friend: {
    id: string
    name: string
    tierLabel: string | null
    tierColor: string | null
  }
  activityId: string
  currentRating: number | null
}

export function WizardRatingRow({
  friend,
  activityId,
  currentRating,
}: WizardRatingRowProps) {
  const fetcher = useFetcher()

  // Optimistic: use the in-flight value if a fetcher is submitting
  const optimisticRating = fetcher.formData
    ? fetcher.formData.get('intent') === 'clear-rating'
      ? null
      : Number(fetcher.formData.get('rating'))
    : currentRating

  function handleClick(value: number) {
    const isSameRating = optimisticRating === value
    fetcher.submit(
      {
        intent: isSameRating ? 'clear-rating' : 'set-rating',
        friendId: friend.id,
        activityId,
        ...(isSameRating ? {} : { rating: String(value) }),
      },
      { method: 'post' },
    )
  }

  const isSubmitting = fetcher.state !== 'idle'

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border',
        isSubmitting && 'opacity-70',
      )}
    >
      <Avatar
        name={friend.name}
        size="xs"
        color={friend.tierColor || undefined}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">
          {friend.name}
        </span>
        {friend.tierLabel && (
          <span className="text-[10px] text-muted-foreground">
            {friend.tierLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(value => {
          const isActive = optimisticRating === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              title={ACTIVITY_RATING_LABELS[value]}
              className="px-2 py-1 text-xs rounded-md border transition-colors"
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
        <span
          className="text-xs ml-1.5 w-24 hidden sm:inline-block"
          style={
            optimisticRating
              ? { color: RATING_COLORS[optimisticRating] }
              : undefined
          }
        >
          {optimisticRating ? ACTIVITY_RATING_LABELS[optimisticRating] : ''}
        </span>
      </div>
    </div>
  )
}
