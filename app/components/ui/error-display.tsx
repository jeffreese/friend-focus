import { isRouteErrorResponse } from 'react-router'

export function ErrorDisplay({ error }: { error: unknown }) {
  let title = 'Something went wrong'
  let description = 'An unexpected error occurred.'

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Page Not Found' : `Error ${error.status}`
    description = error.statusText || description
  } else if (error instanceof Error) {
    description = error.message
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive-light flex items-center justify-center text-lg">
          !
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
