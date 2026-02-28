# 003 — Authentication: better-auth

Date: 2026-02-27

Status: Accepted

## Context

We need session-based authentication that works with server-side rendering and
integrates with our database. The main contenders were:

- **better-auth** — A batteries-included auth library with database adapters
- **lucia-auth** — A minimal auth library (now deprecated)
- **Auth.js (NextAuth)** — Primarily designed for Next.js
- **Rolling our own** — Using bcrypt + sessions manually

## Decision

We chose better-auth.

better-auth provides a complete auth system that handles the details we'd
rather not implement ourselves: password hashing, session management, cookie
handling, CSRF protection, and rate limiting. It has first-class support for
Drizzle ORM, which means it manages its own tables (user, session, account,
verification) through our existing database connection.

The API is clean — a single `auth.handler(request)` call handles all auth
endpoints, and server-side session checking is straightforward with
`auth.api.getSession()`.

Compared to rolling our own, better-auth saves weeks of work and handles edge
cases (timing attacks, session fixation, cookie security flags) that are easy to
get wrong.

Compared to lucia-auth, better-auth is actively maintained and more
feature-complete. Lucia was a good library but has been deprecated by its
author.

Compared to Auth.js, better-auth is framework-agnostic and works naturally with
React Router's loader/action model. Auth.js was designed primarily for Next.js
and its adapter pattern can be awkward outside that ecosystem.

## Consequences

**Good:**
- Complete auth solution out of the box (email/password, sessions, cookies)
- Drizzle adapter means auth tables live alongside our app tables
- Plugin system for OAuth, 2FA, passkeys, magic links when needed
- Cookie caching reduces database lookups for session verification
- Active development and responsive maintainer

**Neutral:**
- Auth tables are managed by better-auth's schema, which means we include their
  generated table definitions in our schema file
- The splat route pattern (`/api/auth/*`) is unconventional but works well

**Trade-offs:**
- Newer library with a smaller community than Auth.js
- Vendor lock-in to better-auth's session format and API
- Cookie forwarding in React Router actions requires manual header handling
