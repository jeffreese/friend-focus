import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { env } from '~/lib/env.server'
import * as schema from './schema'

function createDb() {
  const sqlite = new Database(env.DATABASE_URL)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

declare const globalThis: {
  __db: ReturnType<typeof createDb> | undefined
} & typeof global

export const db = globalThis.__db ?? createDb()

if (env.NODE_ENV !== 'production') {
  globalThis.__db = db
}
