import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '~/lib/utils'

function BackLink({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors',
        className,
      )}
    >
      <ArrowLeft size={16} />
      {children}
    </Link>
  )
}

export { BackLink }
