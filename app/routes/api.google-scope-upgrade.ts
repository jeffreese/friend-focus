import { env } from '~/lib/env.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/api.google-scope-upgrade'

/**
 * GET route that constructs a Google OAuth authorization URL with broader
 * scopes (contacts read+write) and redirects the user to Google.
 *
 * After granting, Google redirects back to better-auth's callback handler,
 * which updates the stored token/scope in the account table.
 */
export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request)

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Response('Google not configured', { status: 500 })
  }

  const url = new URL(request.url)
  const callbackURL = url.searchParams.get('callbackURL') || '/profile'

  // Build the Google OAuth authorization URL
  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/callback/google`

  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/contacts', // Read + write (upgrade from contacts.readonly)
  ]

  // Generate a simple state parameter to pass the callback URL through
  const state = JSON.stringify({ callbackURL })
  const stateEncoded = btoa(state)

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes.join(' '))
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent') // Force re-consent to get new scope
  authUrl.searchParams.set('state', stateEncoded)

  return Response.redirect(authUrl.toString(), 302)
}
