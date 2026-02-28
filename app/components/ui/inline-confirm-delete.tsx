import { Trash2, X } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { cn } from '~/lib/utils'

function InlineConfirmDelete({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
} & React.ComponentProps<'div'>) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div
        data-slot="inline-confirm-delete"
        className={cn('flex items-center justify-end gap-1', className)}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Cancel delete"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div data-slot="inline-confirm-delete" className={className} {...props}>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export { InlineConfirmDelete }
