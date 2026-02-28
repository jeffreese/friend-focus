import { cn } from '~/lib/utils'

function FormField({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>
}

export { FormField }
