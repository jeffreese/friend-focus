# Routing

We use [React Router v7](https://reactrouter.com/) in framework mode with
server-side rendering. Routes are configured explicitly in a single file rather
than using file-based routing conventions.

## Route Configuration

All routes are defined in `app/routes.ts`:

```ts
import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
    route('logout', 'routes/logout.tsx'),
    route('protected', 'routes/protected.tsx'),
    route('forgot-password', 'routes/forgot-password.tsx'),
    route('reset-password', 'routes/reset-password.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
  route('api/auth/*', 'routes/api.auth.$.ts'),
  route('api/health', 'routes/api.health.ts'),
] satisfies RouteConfig
```

We prefer explicit route configuration because it makes the routing structure
easy to understand at a glance. There's no magic file-naming conventions to
remember.

## Adding a New Route

1. Create the route file in `app/routes/`:

```ts
// app/routes/about.tsx
export default function About() {
  return <h1>About</h1>
}
```

2. Register it in `app/routes.ts`:

```ts
layout('routes/layout.tsx', [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'), // Add here
  // ...
]),
```

3. Optionally add a sidebar link in `app/routes/layout.tsx`.

## Loaders and Actions

React Router's data model uses **loaders** to fetch data and **actions** to
handle mutations. Both run on the server.

### Loaders

Loaders run before the component renders. They receive the request and return
data that the component can access via `useLoaderData()`:

```ts
import type { Route } from './+types/my-route'

export async function loader({ request }: Route.LoaderArgs) {
  const posts = await db.select().from(postsTable)
  return { posts }
}

export default function MyRoute() {
  const { posts } = useLoaderData<typeof loader>()
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Actions

Actions handle form submissions and other mutations:

```ts
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  // Process the form...
  return redirect('/success')
}
```

## Layout Routes

The `layout()` wrapper in `routes.ts` creates a shared layout. Our main layout
(`routes/layout.tsx`) provides the sidebar, header, and auth-aware navigation.
All routes nested inside it render into the layout's `<Outlet />`.

## Catch-All Route (404)

The `route('*', 'routes/not-found.tsx')` entry at the end of the layout group
catches any URL that doesn't match a defined route. Its loader returns a 404
status (for SEO/bots) and the component renders a friendly "Page Not Found"
message inside the app shell with the sidebar.

The catch-all must be the **last** entry in the layout group so it doesn't
shadow other routes.

## API Routes

Routes that only export a `loader` and/or `action` (no default component) work
as API endpoints. The better-auth handler at `routes/api.auth.$.ts` is a splat
route that delegates all `/api/auth/*` requests to better-auth. The health check
at `routes/api.health.ts` is a simple endpoint that verifies the database
connection.

API routes are defined outside the layout group since they don't need the
sidebar/header UI.

## Type-Safe Routes

React Router v7 generates route types automatically. Import them from the
`./+types/` directory:

```ts
import type { Route } from './+types/my-route'
```

This gives you typed `LoaderArgs`, `ActionArgs`, and loader return types without
manual annotation.
