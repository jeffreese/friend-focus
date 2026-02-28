import { APP_NAME } from '~/config'
import type { Route } from './+types/home'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: APP_NAME },
    {
      name: 'description',
      content: `${APP_NAME} — built with React Router v7.`,
    },
  ]
}

// TODO: Replace this page with your own dashboard content.
export default function Home() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to {APP_NAME}. Edit{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
          app/routes/home.tsx
        </code>{' '}
        to get started.
      </p>
    </div>
  )
}
