# 009 — Package Manager: pnpm

Date: 2026-02-27

Status: Accepted

## Context

We need a package manager that's fast, reliable, and handles monorepo-style
dependencies well. The main contenders were:

- **pnpm** — Fast, disk-efficient package manager with strict dependency
  resolution
- **npm** — The default, ships with Node.js
- **yarn** (v4/Berry) — Plug'n'Play with zero-installs
- **bun** — All-in-one runtime with built-in package management

## Decision

We chose pnpm.

pnpm is fast, disk-efficient (it uses a content-addressable store and hard links
instead of copying), and has strict dependency resolution that catches phantom
dependencies — packages you use but didn't explicitly declare.

Compared to npm, pnpm is faster and its strict `node_modules` structure prevents
accidentally depending on transitive dependencies.

Compared to yarn Berry, pnpm is more conventional. Yarn's Plug'n'Play system
changes how module resolution works, which can cause compatibility issues with
tools that expect a traditional `node_modules` directory.

Compared to bun, pnpm is more mature and has better compatibility across the
Node.js ecosystem. Bun is fast and promising, but some packages (particularly
native addons like better-sqlite3) can have issues.

**Note:** We use `node-linker=hoisted` in `.npmrc`. By default, pnpm uses a
symlinked `node_modules` structure, which can cause issues with React Router
v7's SSR — Vite sees multiple copies of React through symlinks, causing "Invalid
hook call" errors. Hoisted mode flattens the dependency tree like npm, avoiding
this problem while keeping pnpm's speed and disk efficiency benefits.

## Consequences

**Good:**
- Fast installs (content-addressable store, hard links)
- Disk efficient — shared packages across projects
- Strict dependency resolution catches phantom dependencies
- Built-in support for workspace protocols (useful if the template grows)
- `corepack` integration for version pinning

**Neutral:**
- Requires installing pnpm separately (though `corepack enable` handles this)
- The `.npmrc` with `node-linker=hoisted` negates some of pnpm's strictness
  benefits

**Trade-offs:**
- Less familiar to developers who only know npm
- Hoisted mode is required for React Router SSR compatibility, which reduces
  pnpm's strict isolation advantage
- Some CI/CD environments don't have pnpm pre-installed
