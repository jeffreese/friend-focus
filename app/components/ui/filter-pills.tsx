import type * as React from 'react'
import { cn } from '~/lib/utils'

function FilterPill({
  active,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="filter-pill"
      className={cn(
        'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border text-muted-foreground hover:bg-accent',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}

function FilterPillLink({
  active,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'a'> & { active?: boolean }) {
  return (
    <a
      data-slot="filter-pill"
      className={cn(
        'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border text-muted-foreground hover:bg-accent',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </a>
  )
}

export { FilterPill, FilterPillLink }
