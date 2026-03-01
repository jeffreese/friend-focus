import { X } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Avatar } from '~/components/ui/avatar'
import { Select } from '~/components/ui/select'
import { CONNECTION_STRENGTHS, CONNECTION_TYPES } from '~/lib/schemas'
import { cn } from '~/lib/utils'

interface ConnectionWizardRowProps {
  friend: {
    id: string
    name: string
    tierLabel: string | null
    tierColor: string | null
  }
  selectedFriendId: string
  currentConnection: {
    id: string
    type: string | null
    strength: number
  } | null
}

export function ConnectionWizardRow({
  friend,
  selectedFriendId,
  currentConnection,
}: ConnectionWizardRowProps) {
  const fetcher = useFetcher()

  // Optimistic: use in-flight values if submitting
  const optimistic = getOptimisticState(fetcher, currentConnection)

  function handleTypeChange(newType: string) {
    fetcher.submit(
      {
        intent: 'set-connection',
        selectedFriendId,
        otherFriendId: friend.id,
        ...(optimistic ? { connectionId: optimistic.id } : {}),
        type: newType,
        strength: String(optimistic?.strength ?? 3),
      },
      { method: 'post' },
    )
  }

  function handleStrengthClick(value: number) {
    fetcher.submit(
      {
        intent: 'set-connection',
        selectedFriendId,
        otherFriendId: friend.id,
        ...(optimistic ? { connectionId: optimistic.id } : {}),
        type: optimistic?.type ?? '',
        strength: String(value),
      },
      { method: 'post' },
    )
  }

  function handleDelete() {
    if (!optimistic) return
    fetcher.submit(
      {
        intent: 'delete-connection',
        selectedFriendId,
        otherFriendId: friend.id,
        connectionId: optimistic.id,
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
      <div className="flex items-center gap-1.5 shrink-0">
        <Select
          className="w-24 h-7 text-xs"
          value={optimistic?.type ?? ''}
          onChange={e => handleTypeChange(e.target.value)}
          aria-label="Connection type"
        >
          <option value="">—</option>
          {CONNECTION_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(value => {
            const isActive = optimistic && value <= optimistic.strength
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStrengthClick(value)}
                title={CONNECTION_STRENGTHS[value - 1]}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  isActive
                    ? 'bg-primary'
                    : 'bg-border hover:bg-muted-foreground/30',
                )}
              />
            )
          })}
        </div>
        {optimistic ? (
          <button
            type="button"
            onClick={handleDelete}
            title="Remove connection"
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <span className="w-3.5" />
        )}
      </div>
    </div>
  )
}

function getOptimisticState(
  fetcher: ReturnType<typeof useFetcher>,
  currentConnection: ConnectionWizardRowProps['currentConnection'],
) {
  if (!fetcher.formData) return currentConnection

  const intent = fetcher.formData.get('intent')

  if (intent === 'delete-connection') return null

  if (intent === 'set-connection') {
    const type = fetcher.formData.get('type') as string
    const strength = Number(fetcher.formData.get('strength'))
    return {
      id: (fetcher.formData.get('connectionId') as string) || '__optimistic__',
      type: type || null,
      strength: strength || 3,
    }
  }

  return currentConnection
}
