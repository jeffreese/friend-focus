import type * as React from 'react'
import { cn } from '~/lib/utils'

function ResponsiveTable({
  table,
  cards,
  className,
}: {
  table: React.ReactNode
  cards: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="hidden md:block">{table}</div>
      <div className="md:hidden">{cards}</div>
    </div>
  )
}

export { ResponsiveTable }
