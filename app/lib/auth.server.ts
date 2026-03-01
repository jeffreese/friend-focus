import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '~/db/index.server'
import * as schema from '~/db/schema'
import { sendPasswordResetEmail } from '~/lib/email.server'
import { env } from '~/lib/env.server'

const googleProvider =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/contacts.readonly',
          ],
          accessType: 'offline' as const,
          prompt: 'consent' as const,
        },
      }
    : undefined

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail(user.email, url)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh after 1 day of use
  },
  trustedOrigins: ['http://127.0.0.1:5199'],
  ...(googleProvider && { socialProviders: googleProvider }),
})

export const isGoogleEnabled = !!googleProvider
