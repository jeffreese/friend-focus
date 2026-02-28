import type * as React from 'react'

import { cn } from '~/lib/utils'

function Textarea({
  className,
  error,
  ...props
}: React.ComponentProps<'textarea'> & { error?: boolean }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        error &&
          'border-destructive ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/30',
        'resize-none',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
