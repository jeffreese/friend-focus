import type * as React from 'react'

import { cn } from '~/lib/utils'

function StrengthDots({
  value,
  label,
  max = 5,
  className,
  ...props
}: {
  value: number
  label?: string
  max?: number
} & Omit<React.ComponentProps<'span'>, 'children'>) {
  return (
    <span
      data-slot="strength-dots"
      role="img"
      aria-label={`${value} out of ${max}${label ? `: ${label}` : ''}`}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    >
      <span className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              i < value ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </span>
      {label && <span className="text-xs">{label}</span>}
    </span>
  )
}

export { StrengthDots }
