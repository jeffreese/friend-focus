import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().default('sqlite.db'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default('Friend Focus <onboarding@resend.dev>'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

export const env = envSchema.parse(process.env)

if (
  env.NODE_ENV === 'production' &&
  env.BETTER_AUTH_SECRET === 'change-me-to-a-random-secret'
) {
  console.warn(
    '[env] WARNING: BETTER_AUTH_SECRET is still the default value. Set a secure random secret for production.',
  )
}

if (
  env.NODE_ENV === 'production' &&
  (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
) {
  console.warn(
    '[env] WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google sign-in is disabled.',
  )
}
