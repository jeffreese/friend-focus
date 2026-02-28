import { cn } from '~/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-warning/10 text-warning',
  finalized: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
}

function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
        STATUS_COLORS[status] || 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {status}
    </span>
  )
}

export { StatusBadge, STATUS_COLORS }
