import { cn } from '~/lib/utils'

function FormError({
  errors,
  className,
}: {
  errors?: string[]
  className?: string
}) {
  if (!errors?.length) return null

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg bg-destructive-light px-4 py-3 text-sm text-destructive',
        className,
      )}
    >
      {errors.map((error, i) => (
        <p key={i}>{error}</p>
      ))}
    </div>
  )
}

export { FormError }
