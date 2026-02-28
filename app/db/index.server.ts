import { resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { env } from '~/lib/env.server'
import * as schema from './schema'

function createDb() {
  const sqlite = new Database(env.DATABASE_URL)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') })
  return db
}

declare const globalThis: {
  __db: ReturnType<typeof createDb> | undefined
} & typeof global

export const db = globalThis.__db ?? createDb()

if (env.NODE_ENV !== 'production') {
  globalThis.__db = db
}
