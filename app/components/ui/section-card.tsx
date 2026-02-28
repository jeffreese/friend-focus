import type * as React from 'react'

import { cn } from '~/lib/utils'

function SectionCard({
  icon,
  title,
  count,
  action,
  children,
  className,
  ...props
}: {
  icon?: React.ReactNode
  title: string
  count?: number
  action?: React.ReactNode
  children: React.ReactNode
} & Omit<React.ComponentProps<'section'>, 'title'>) {
  return (
    <section
      data-slot="section-card"
      aria-label={title}
      className={cn('rounded-xl border border-border-light bg-card', className)}
      {...props}
    >
      <div className="p-5 border-b border-border-light flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          {icon}
          {title}
          {count !== undefined && (
            <span className="text-muted-foreground font-normal">({count})</span>
          )}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export { SectionCard }
