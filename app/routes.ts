import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('friends', 'routes/friends.tsx'),
    route('friends/new', 'routes/friends.new.tsx'),
    route('friends/:id', 'routes/friends.$id.tsx'),
    route('friends/:id/edit', 'routes/friends.$id.edit.tsx'),
    route('friends/:id/delete', 'routes/friends.$id.delete.tsx'),
    route('events', 'routes/events.tsx'),
    route('events/new', 'routes/events.new.tsx'),
    route('events/:id', 'routes/events.$id.tsx'),
    route('relationships', 'routes/relationships.tsx'),
    route('journal', 'routes/journal.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
  layout('routes/auth-layout.tsx', [
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
    route('forgot-password', 'routes/forgot-password.tsx'),
    route('reset-password', 'routes/reset-password.tsx'),
  ]),
  route('logout', 'routes/logout.tsx'),
  route('api/auth/*', 'routes/api.auth.$.ts'),
  route('api/health', 'routes/api.health.ts'),
] satisfies RouteConfig
