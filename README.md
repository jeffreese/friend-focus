# Friend Focus

A full-stack application built with React Router v7, TypeScript, and modern tooling.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Register an account, log in,
explore the protected route — the full auth flow works out of the box.

## What's Included

| Layer | Technology |
|-------|-----------|
| Framework | [React Router v7](https://reactrouter.com/) (SSR) |
| Language | TypeScript 5 (strict) |
| Build | Vite |
| Styling | Tailwind CSS v4 (OKLCH color system) |
| Database | Drizzle ORM + SQLite |
| Auth | better-auth (email/password, session-based) |
| Forms | Conform + Zod (progressive enhancement) |
| State | Zustand (client UI state) |
| Linting | Biome (formatting + linting) |
| Testing | Vitest + Testing Library |

## Documentation

Everything you need to know is in the [`docs/`](./docs) folder:

- [**Getting Started**](./docs/getting-started.md) — Setup, commands, project
  structure
- [**Topic Guides**](./docs/README.md) — How each piece works (routing, database,
  auth, forms, styling, testing, deployment)
- [**Decisions**](./docs/README.md#decisions) — Why we chose each technology, with
  alternatives considered

## Commands

```bash
pnpm dev           # Start dev server
pnpm build         # Production build
pnpm lint:fix      # Format and fix lint issues
pnpm typecheck     # TypeScript check
pnpm test          # Run tests
pnpm db:studio     # Visual database browser
```

See [Getting Started](./docs/getting-started.md) for the full command reference.

## License

MIT
