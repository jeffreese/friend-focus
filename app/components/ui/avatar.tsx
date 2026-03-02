import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { useState } from 'react'

import { cn } from '~/lib/utils'

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold shrink-0 overflow-hidden',
  {
    variants: {
      size: {
        xs: 'w-8 h-8 text-xs',
        sm: 'w-10 h-10 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({
  name,
  src,
  size,
  color,
  className,
  ...props
}: {
  name: string
  src?: string | null
  color?: string
} & VariantProps<typeof avatarVariants> &
  Omit<React.ComponentProps<'div'>, 'children'>) {
  const initials = getInitials(name)
  const [imgError, setImgError] = useState(false)
  const showImage = !!src && !imgError

  return (
    <div
      data-slot="avatar"
      role="img"
      aria-label={name}
      className={cn(
        avatarVariants({ size }),
        !showImage && (color ? 'text-white' : 'bg-primary/10 text-primary'),
        className,
      )}
      style={!showImage && color ? { backgroundColor: color } : undefined}
      {...props}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}

export { Avatar, avatarVariants, getInitials }
