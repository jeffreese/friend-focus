# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- [pnpm](https://pnpm.io/) 9 or later

## Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/jeffreese/friend-focus.git
cd friend-focus
pnpm install
```

The setup script does the following:

1. Renames the project in `package.json`
2. Generates a `.env` file with a random `BETTER_AUTH_SECRET`
3. Installs dependencies with `pnpm install`
4. Creates the database and pushes the schema with `pnpm db:push`
5. Seeds the database with sample data
6. Initializes a fresh git repository

## Development

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). You should see the
dashboard with a sidebar.

The seed script creates a test account you can use right away:

| | |
|---|---|
| **Email** | `test@example.com` |
| **Password** | `password123` |

Or register a new account — the full auth flow works out of the box.

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start the dev server with HMR |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production server |
| `pnpm lint` | Check code with Biome |
| `pnpm lint:fix` | Auto-fix lint issues and format |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly (dev shortcut) |
| `pnpm db:studio` | Open Drizzle Studio GUI |
| `pnpm db:seed` | Seed the database |

## Project Structure

```
app/
├── root.tsx                 # HTML shell, error boundary
├── app.css                  # Tailwind theme (OKLCH tokens)
├── routes.ts                # Route config
├── routes/                  # Page and API routes
├── components/ui/           # Reusable UI primitives
├── db/                      # Database schema, connection, seed
├── lib/                     # Auth, sessions, validation, utilities
└── stores/                  # Zustand client state
```

## What to Do Next

Once you're running, here's a typical workflow for building your app:

1. **Define your data model** — Edit `app/db/schema.ts` to add your tables, then
   run `pnpm db:generate && pnpm db:migrate`. See [Database](./database.md).
2. **Add routes** — Create files in `app/routes/` and register them in
   `app/routes.ts`. See [Routing](./routing.md).
3. **Build forms** — Use Conform + Zod for validated forms with progressive
   enhancement. See [Forms](./forms.md).
4. **Customize the theme** — Edit the `@theme` block in `app/app.css` to match
   your brand. See [Styling](./styling.md).
5. **Protect routes** — Use `requireSession()` in loaders to guard
   authenticated pages. See [Authentication](./authentication.md).
