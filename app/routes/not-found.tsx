import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function loader() {
  return new Response(null, { status: 404 })
}

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center text-2xl">
          ?
        </div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
