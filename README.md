# Friend Focus

A personal friendship CRM to help you stay intentional about the people you
care about. Track friends, plan events, log journal entries, and get
recommendations for who to reach out to next.

## Features

- **Friends** — Store contact info, birthdays, love languages, dietary
  preferences, and personal notes for each friend
- **Closeness tiers** — Organize friends by how close you are (e.g., inner
  circle, close, casual) with customizable labels
- **Events** — Plan hangouts with activity suggestions, invite friends, and
  track attendance
- **Relationships** — Map connections between friends with strength ratings and
  visualize your social graph
- **Journal** — Log interactions and reflections tied to friends or events
- **Care mode** — Flag friends going through a tough time so you remember to
  check in
- **Dashboard** — See upcoming birthdays, recent activity, friends in care mode,
  and recommendations for who to reach out to

## Quick Start

```bash
pnpm install
pnpm db:migrate
pnpm db:seed      # Creates test@example.com / password123
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React Router v7](https://reactrouter.com/) (SSR) |
| Language | TypeScript 5 (strict) |
| Build | Vite |
| Styling | Tailwind CSS v4 (OKLCH color system) |
| Components | shadcn/ui (Radix UI) |
| Database | Drizzle ORM + SQLite |
| Auth | better-auth (email/password, session-based) |
| Forms | Conform + Zod (progressive enhancement) |
| Linting | Biome |
| Testing | Vitest + Testing Library |

## Commands

```bash
pnpm dev           # Start dev server (localhost:5173)
pnpm build         # Production build
pnpm lint:fix      # Format and fix lint issues
pnpm typecheck     # TypeScript check
pnpm test          # Run tests
pnpm db:generate   # Generate migrations after schema changes
pnpm db:migrate    # Run migrations
pnpm db:studio     # Visual database browser
```

## Documentation

See the [`docs/`](./docs) folder for topic guides on routing, database,
authentication, forms, styling, testing, and deployment.

## License

MIT
