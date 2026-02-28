# State Management

State in this template is split into two categories with different tools for
each:

1. **Server state** — Data from loaders and actions (React Router handles this)
2. **Client UI state** — Ephemeral UI concerns like sidebar collapse (Zustand
   handles this)

## Server State

React Router's loader/action model means most state lives on the server. When
you need data, fetch it in a loader. When you need to mutate, do it in an
action. The framework handles revalidation automatically after mutations.

```ts
// Data fetching — just use a loader
export async function loader({ request }: Route.LoaderArgs) {
  const posts = await db.select().from(postsTable)
  return { posts }
}

// The component gets fresh data on every navigation
export default function Posts() {
  const { posts } = useLoaderData<typeof loader>()
  return <PostList posts={posts} />
}
```

There's no need for client-side caching libraries (React Query, SWR, Apollo)
because the server is the source of truth and React Router keeps client data
fresh.

## Client UI State (Zustand)

For client-only UI state that doesn't belong on the server, we use
[Zustand](https://zustand.docs.pmnd.rs/). The template includes one example
store for sidebar state:

```ts
// app/stores/ui-store.ts
import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>(set => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
```

Use it in components with selector hooks:

```tsx
const collapsed = useUIStore(s => s.sidebarCollapsed)
const toggleSidebar = useUIStore(s => s.toggleSidebar)
```

## When to Use What

| Need | Tool |
|------|------|
| Data from the database | React Router loader |
| Form submissions, mutations | React Router action |
| Sidebar open/closed | Zustand store |
| Modal visibility | Zustand store or `useState` |
| Theme preference | Zustand store (with persistence) |
| Form field values | Conform (managed by the form library) |
| URL-derived state | `useSearchParams` or loader params |

The rule of thumb: if the state comes from or affects the server, use
loaders/actions. If it's purely a UI concern that doesn't survive a page
refresh, use Zustand or local React state.

## Adding a New Store

1. Create a file in `app/stores/`:

```ts
// app/stores/my-store.ts
import { create } from 'zustand'

interface MyState {
  count: number
  increment: () => void
}

export const useMyStore = create<MyState>(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}))
```

2. Import and use the selector hook in your component.

## Persistence

Zustand supports persistence via middleware if you need state to survive page
refreshes:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePrefsStore = create(
  persist(
    set => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'user-prefs' },
  ),
)
```

This stores the state in `localStorage` under the key `user-prefs`.

## Why Zustand?

See [Decision 006 — State Management](./decisions/006-state-management.md) for
why we chose Zustand over Redux, Jotai, and other options.
