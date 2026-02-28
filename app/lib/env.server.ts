import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().default('sqlite.db'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
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
