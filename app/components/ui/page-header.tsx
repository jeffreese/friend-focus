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
      className={cn('flex items-center justify-between mb-6', className)}
    >
      <h2 className="text-2xl font-bold">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export { PageHeader }
