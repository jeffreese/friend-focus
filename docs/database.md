# Database

We use [Drizzle ORM](https://orm.drizzle.team/) with
[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for a SQLite
database. This gives us type-safe database access with zero code generation
steps — your TypeScript schema definitions _are_ the source of truth.

## Schema

The database schema lives in `app/db/schema.ts`. It contains the tables
managed by better-auth (user, session, account, verification) plus a commented
example showing the pattern for adding your own tables:

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
```

## Adding a Table

1. Define the table in `app/db/schema.ts` (uncomment or add below the
   "Application tables" section)
2. Generate a migration: `pnpm db:generate`
3. Apply it: `pnpm db:migrate`

During development, you can skip migrations and push directly:

```bash
pnpm db:push
```

This is faster but doesn't create migration files. Use `db:generate` +
`db:migrate` when you want a migration history you can replay in production.

## Database Connection

The connection singleton lives in `app/db/index.server.ts`. It uses the
GlobalThis pattern to survive Vite's HMR without leaking connections:

```ts
function createDb() {
  const sqlite = new Database(process.env.DATABASE_URL ?? 'sqlite.db')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> }
export const db = globalForDb.__db ?? (globalForDb.__db = createDb())
```

The `.server.ts` suffix ensures this file is never included in the client
bundle.

## Querying

Drizzle supports both a SQL-like query builder and a relational query API.
Always import `db` from `~/db/index.server` in server-side code (loaders,
actions):

```ts
import { db } from '~/db/index.server'
import { posts } from '~/db/schema'
import { eq } from 'drizzle-orm'

// Select all
const allPosts = await db.select().from(posts)

// Filter
const userPosts = await db
  .select()
  .from(posts)
  .where(eq(posts.authorId, userId))

// Insert
await db.insert(posts).values({
  title: 'Hello',
  content: 'World',
  authorId: userId,
})
```

## Seeding

The seed script at `app/db/seed.ts` creates a test user for development. Run
it with:

```bash
pnpm db:seed
```

Edit this file to seed your own tables.

## Drizzle Studio

For a visual database browser during development:

```bash
pnpm db:studio
```

This opens a web UI where you can browse tables, run queries, and edit data.

## Why SQLite?

See [Decision 002 — Database](./decisions/002-database.md) for the full
reasoning. The short version: SQLite is fast, requires no separate server
process, and is more than capable for most applications. The database is a
single file that deploys with your app.
