# 001 — Framework: React Router v7

Date: 2026-02-27

Status: Accepted

## Context

We need a full-stack React framework that supports server-side rendering,
server-side data loading, and form handling with progressive enhancement. The
main contenders were:

- **Next.js** — The most popular React framework, with App Router and Server
  Components
- **React Router v7** (framework mode) — The successor to Remix, with a mature
  loader/action model
- **TanStack Start** — A newer framework built on TanStack Router

## Decision

We chose React Router v7 in framework mode.

React Router's loader/action model is simple and predictable. Loaders fetch data
before rendering, actions handle mutations, and the framework revalidates
automatically after mutations. There's no client-side cache to manage, no
complex cache invalidation, and no distinction between server and client
components.

Compared to Next.js App Router, React Router avoids the complexity of React
Server Components, which introduce a new mental model (server vs client
components, "use server" directives, serialization boundaries). For a template
that people should be able to understand quickly, the simpler model wins.

Compared to TanStack Start, React Router v7 is more mature with better
ecosystem support and documentation. TanStack Start is promising but was still
in beta at the time of this decision.

React Router v7 also has strong TypeScript support with auto-generated route
types, giving us type-safe loaders and actions without manual type annotation.

## Consequences

**Good:**
- Simple mental model — loaders fetch, actions mutate, everything revalidates
- Mature ecosystem with extensive documentation
- Type-safe routes via auto-generated types
- Progressive enhancement works out of the box
- SSR with no additional configuration

**Neutral:**
- Route configuration is explicit (in `routes.ts`) rather than file-system based
- No React Server Components (but we don't need them for this use case)

**Trade-offs:**
- Smaller community than Next.js, fewer third-party examples
- If we ever need React Server Components, we'd need to migrate
- Vite-only (no webpack support), though this is also an advantage
