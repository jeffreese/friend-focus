import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
    route('logout', 'routes/logout.tsx'),
    route('forgot-password', 'routes/forgot-password.tsx'),
    route('reset-password', 'routes/reset-password.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
  route('api/auth/*', 'routes/api.auth.$.ts'),
  route('api/health', 'routes/api.health.ts'),
] satisfies RouteConfig
