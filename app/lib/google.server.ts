import { and, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { account } from '~/db/schema'
import { env } from '~/lib/env.server'

export interface GoogleTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  scope: string | null
}

/**
 * Get Google tokens for a user from the account table.
 * Returns null if the user has no Google account linked.
 */
export function getGoogleTokens(userId: string): GoogleTokens | null {
  const googleAccount = db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      scope: account.scope,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'google')))
    .get()

  if (!googleAccount?.accessToken) {
    return null
  }

  return {
    accessToken: googleAccount.accessToken,
    refreshToken: googleAccount.refreshToken,
    expiresAt: googleAccount.accessTokenExpiresAt,
    scope: googleAccount.scope,
  }
}

/**
 * Check if a user has Google connected with the required scopes.
 */
export function hasGoogleScopes(
  userId: string,
  requiredScopes: string[],
): boolean {
  const googleAccount = db
    .select({ scope: account.scope })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'google')))
    .get()

  if (!googleAccount?.scope) return false

  const grantedScopes = googleAccount.scope.split(/[\s,]+/)
  return requiredScopes.every(s => grantedScopes.includes(s))
}

/**
 * Refresh an expired Google access token using the stored refresh token.
 * Updates the token in the database and returns the new access token.
 */
async function refreshGoogleAccessToken(
  userId: string,
): Promise<string | null> {
  const tokens = getGoogleTokens(userId)
  if (!tokens?.refreshToken) return null

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as {
    access_token: string
    expires_in: number
  }
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)

  db.update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(and(eq(account.userId, userId), eq(account.providerId, 'google')))
    .run()

  return data.access_token
}

/**
 * Get a valid (non-expired) Google access token, refreshing if needed.
 */
export async function getValidGoogleAccessToken(
  userId: string,
): Promise<string | null> {
  const tokens = getGoogleTokens(userId)
  if (!tokens) return null

  const bufferMs = 5 * 60 * 1000
  const isExpired =
    tokens.expiresAt && tokens.expiresAt.getTime() - bufferMs < Date.now()

  if (!isExpired) return tokens.accessToken

  return refreshGoogleAccessToken(userId)
}

export class GoogleCalendarNotFoundError extends Error {
  constructor(googleEventId: string) {
    super(
      `Google Calendar event ${googleEventId} not found (likely deleted on Google's side)`,
    )
    this.name = 'GoogleCalendarNotFoundError'
  }
}

export interface GoogleCalendarEventInput {
  summary: string
  description?: string
  location?: string
  start: { date?: string; dateTime?: string; timeZone?: string }
  end: { date?: string; dateTime?: string; timeZone?: string }
}

export interface GoogleCalendarEventResult {
  id: string
  htmlLink: string
}

/**
 * Create an event on the user's primary Google Calendar.
 */
export async function createGoogleCalendarEvent(
  userId: string,
  calendarEvent: GoogleCalendarEventInput,
): Promise<GoogleCalendarEventResult> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) {
    throw new Error(
      'Google account not connected or token refresh failed. Try reconnecting Google on your Profile page.',
    )
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google Calendar API error (${response.status}): ${errorBody}`,
    )
  }

  const result = (await response.json()) as { id: string; htmlLink: string }
  return { id: result.id, htmlLink: result.htmlLink }
}

/**
 * Update an existing event on the user's primary Google Calendar.
 * Throws GoogleCalendarNotFoundError if the event was deleted on Google's side (404/410).
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  googleCalendarEventId: string,
  calendarEvent: GoogleCalendarEventInput,
): Promise<void> {
  const accessToken = await getValidGoogleAccessToken(userId)
  if (!accessToken) {
    throw new Error(
      'Google account not connected or token refresh failed. Try reconnecting Google on your Profile page.',
    )
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleCalendarEventId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    },
  )

  if (response.status === 404 || response.status === 410) {
    throw new GoogleCalendarNotFoundError(googleCalendarEventId)
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Google Calendar API error (${response.status}): ${errorBody}`,
    )
  }
}
