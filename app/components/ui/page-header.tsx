import type * as React from 'react'
import { cn } from '~/lib/utils'

function PageHeader({
  title,
  children,
  className,
}: {
  title: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        'flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export { PageHeader }
