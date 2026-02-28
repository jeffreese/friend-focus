# 002 — Database: Drizzle ORM + SQLite

Date: 2026-02-27

Status: Accepted

## Context

We need a database layer that's type-safe, easy to set up, and doesn't require
external services for development. The main contenders were:

- **Prisma** + PostgreSQL — The most popular ORM in the TypeScript ecosystem
- **Drizzle ORM** + SQLite — A lightweight, TypeScript-native ORM with SQL-like
  syntax
- **Kysely** + SQLite — A type-safe SQL query builder

### Why SQLite?

For a project template, we wanted the simplest possible setup. SQLite requires
no database server — it's a single file. `pnpm install` and you're ready. No
Docker containers, no connection strings, no database setup steps. This matters
a lot for a template because every extra setup step is friction that discourages
adoption.

SQLite is also genuinely capable. It handles concurrent reads via WAL mode,
supports JSON, full-text search, and can handle significant traffic. Unless
you're building a multi-region application with heavy write concurrency, SQLite
is likely sufficient.

## Decision

We chose Drizzle ORM with better-sqlite3 (the synchronous SQLite driver).

Drizzle's schema definitions are plain TypeScript — they're the schema _and_
the types. There's no separate schema language (like Prisma's `.prisma` files)
and no code generation step. You define your tables in TypeScript, import them,
and use them. The types flow naturally.

Drizzle's query API is SQL-like rather than ORM-like. If you know SQL, you know
Drizzle. There's no magic, no implicit joins, no N+1 surprises. The relational
query API is available for convenience, but the core is explicit SQL operations.

## Consequences

**Good:**
- Zero external dependencies for the database (no Docker, no server)
- Schema is TypeScript — no codegen, no separate schema language
- SQL-like API means no ORM abstraction to learn
- Drizzle Kit provides migrations, schema push, and a studio GUI
- Fast — better-sqlite3 is synchronous and avoids promise overhead

**Neutral:**
- SQLite has limitations for multi-process write concurrency (WAL helps but
  doesn't eliminate this)
- The Drizzle ecosystem is smaller than Prisma's

**Trade-offs:**
- No built-in connection pooling (not needed for SQLite)
- Swapping to PostgreSQL later requires changing the driver, some schema syntax,
  and migration files (but Drizzle supports Postgres, so the ORM layer stays)
- SQLite doesn't support some PostgreSQL features like JSONB, array columns, or
  row-level security
