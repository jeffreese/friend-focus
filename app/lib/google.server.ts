import { and, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { account } from '~/db/schema'

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

  const grantedScopes = googleAccount.scope.split(' ')
  return requiredScopes.every(s => grantedScopes.includes(s))
}
