import { Search } from 'lucide-react'
import type * as React from 'react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

function SearchInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input type="text" className="pl-9 bg-card" {...props} />
    </div>
  )
}

export { SearchInput }
