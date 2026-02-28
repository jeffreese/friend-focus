import type * as React from 'react'
import { cn } from '~/lib/utils'

function TabList({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tab-list"
      className={cn(
        'flex items-center gap-1 border-b border-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function Tab({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="tab"
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { Tab, TabList }
