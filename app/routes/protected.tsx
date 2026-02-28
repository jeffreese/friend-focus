import { Shield } from 'lucide-react'
import { useLoaderData } from 'react-router'
import { APP_NAME } from '~/config'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/protected'

export function meta() {
  return [{ title: `Protected — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  return {
    user: session.user,
  }
}

// TODO: Replace this example with your own protected content.
// This route demonstrates the requireSession() pattern — unauthenticated
// visitors are redirected to /login automatically.
export default function Protected() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Protected Page</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Your Profile</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs text-foreground-light">
              {user.id}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        This page is only accessible to authenticated users. Unauthenticated
        visitors are redirected to the login page.
      </p>
    </div>
  )
}
