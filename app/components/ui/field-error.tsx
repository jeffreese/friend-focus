import { cn } from '~/lib/utils'

function FieldError({
  errors,
  className,
}: {
  errors?: string[]
  className?: string
}) {
  if (!errors?.length) return null

  return (
    <p role="alert" className={cn('mt-1 text-xs text-destructive', className)}>
      {errors[0]}
    </p>
  )
}

export { FieldError }
