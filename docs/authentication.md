# Authentication

We use [better-auth](https://www.better-auth.com/) for authentication. It
provides a batteries-included auth system with email/password out of the box and
a plugin system for OAuth, two-factor auth, passkeys, and more.

## How It Works

better-auth runs as an API handler mounted at `/api/auth/*`. It manages its own
database tables (user, session, account, verification) through the Drizzle
adapter, and handles all the auth flows — registration, login, logout, session
management.

### Server Config

The auth configuration lives in `app/lib/auth.server.ts`:

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '~/db/index.server'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
})
```

Cookie caching means the session is verified from a signed cookie for 5 minutes
before hitting the database again. This keeps loader latency low.

### API Route

The splat route at `app/routes/api.auth.$.ts` delegates all requests under
`/api/auth/` to better-auth:

```ts
import { auth } from '~/lib/auth.server'

export async function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request)
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request)
}
```

### Client

The client-side auth utilities live in `app/lib/auth.client.ts`:

```ts
import { signIn, signUp, signOut } from '~/lib/auth.client'

// Sign up
await signUp.email({ email, password, name })

// Sign in
await signIn.email({ email, password })

// Sign out
await signOut()
```

## Session Helpers

Two helpers in `app/lib/session.server.ts` make it easy to work with sessions in
loaders and actions:

### `requireSession(request)`

Returns the session or redirects to `/login`. Use this in loaders for pages that
require authentication:

```ts
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  // session.user is guaranteed to exist
  return { user: session.user }
}
```

### `getOptionalSession(request)`

Returns the session or `null`. Use this when the page works for both
authenticated and unauthenticated users:

```ts
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalSession(request)
  return { user: session?.user ?? null }
}
```

## Auth Forms

The login and register forms use Conform for progressive enhancement. The
important detail is forwarding the `set-cookie` header from better-auth's
response back to the browser:

```ts
export async function action({ request }: Route.ActionArgs) {
  // ... validate form with Conform ...

  const response = await auth.api.signInEmail({ body: { email, password } })
  const setCookie = response.headers.get('set-cookie')

  return redirect('/', {
    headers: setCookie ? { 'set-cookie': setCookie } : {},
  })
}
```

Without forwarding this header, the session cookie won't be set and the user
won't actually be logged in after the redirect.

## Forgot Password / Reset Password

The template includes a password reset flow. In development, reset links are
logged to the console. In production, replace the `sendResetPassword` callback
in `app/lib/auth.server.ts` with your email provider (Resend, Postmark, etc.).

### How it works

1. User visits `/forgot-password` and enters their email
2. The action calls `auth.api.requestPasswordReset()` which triggers the
   `sendResetPassword` callback
3. The response always says "If an account exists, we sent a reset link" to
   prevent email enumeration
4. The reset link redirects to `/reset-password?token=...`
5. User enters a new password + confirmation, the action calls
   `auth.api.resetPassword()` with the token
6. On success, the user is redirected to `/login`

### Wiring up email

Update the callback in `app/lib/auth.server.ts`:

```ts
emailAndPassword: {
  enabled: true,
  async sendResetPassword({ user, url }) {
    // Replace with your email provider
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `<a href="${url}">Reset password</a>`,
    })
  },
},
```

## Adding OAuth Providers

better-auth supports OAuth through plugins. To add GitHub login, for example:

1. Install the plugin (if needed)
2. Add the provider to your auth config in `app/lib/auth.server.ts`
3. Add the corresponding client method
4. Create a "Sign in with GitHub" button that calls the client method

See the [better-auth docs](https://www.better-auth.com/docs) for the full list
of supported providers and plugins.

## Why better-auth?

See [Decision 003 — Authentication](./decisions/003-authentication.md) for the
full reasoning behind choosing better-auth over alternatives like lucia-auth or
building auth from scratch.
