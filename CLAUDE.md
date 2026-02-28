# CLAUDE.md — Friend Focus

This file provides context for AI development tools working in this codebase.
For detailed documentation, see the [`docs/`](./docs) folder.

## Quick Reference

```bash
pnpm dev          # Start dev server (localhost:5173)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # Check with Biome
pnpm lint:fix     # Auto-fix lint + format
pnpm typecheck    # TypeScript check
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (dev)
pnpm db:studio    # Open Drizzle Studio
pnpm db:seed      # Seed database (creates test@example.com / password123)
```

## Development Workflow

**All changes go through pull requests. Never push directly to `main`.**

1. `git checkout -b feature/short-description` from latest `main`
2. Write code, tests, and update relevant documentation
3. Run `pnpm lint:fix && pnpm typecheck && pnpm test` before committing
4. Push the branch and create a PR with `gh pr create`
5. After merge: `git checkout main && git pull origin main`

- All features must have tests
- Documentation must be updated when behavior, structure, or commands change
- Use `db:generate` + `db:migrate` (not `db:push`) for committed schema changes
- Commit messages: imperative mood, explain why, <70 char summary line
- For non-trivial features, create an implementation plan with a tracker in
  Claude's project memory before starting (see Development Workflow docs)

See [Development Workflow](./docs/development-workflow.md) for full details.

## Tech Stack

- **Framework:** React Router v7 (SSR, framework mode)
- **Language:** TypeScript 5 (strict)
- **Build:** Vite
- **Styling:** Tailwind CSS v4 (OKLCH tokens via `:root` + `@theme inline` in `app/app.css`)
- **Components:** shadcn/ui (Radix UI + Tailwind, copy-paste model)
- **Database:** Drizzle ORM + better-sqlite3 (SQLite)
- **Auth:** better-auth (email/password, session-based)
- **Forms:** Conform + Zod (progressive enhancement)
- **State:** Zustand (client UI state only)
- **Linting:** Biome (formatting + linting)
- **Testing:** Vitest + Testing Library
- **Icons:** Lucide React

## Project Structure

```
app/
├── config.ts                # App name/initials (update via setup.sh)
├── root.tsx                 # HTML shell, error boundary
├── app.css                  # Tailwind theme (OKLCH tokens)
├── routes.ts                # Route config
├── routes/
│   ├── layout.tsx           # Sidebar layout (auth-aware)
│   ├── home.tsx             # Dashboard (customize this)
│   ├── login.tsx            # Login form (Conform)
│   ├── register.tsx         # Registration form (Conform)
│   ├── logout.tsx           # Logout action
│   ├── protected.tsx        # Auth-guarded example (customize this)
│   ├── notes.tsx            # Notes list + create (customize this)
│   ├── notes.$noteId.tsx    # Note detail — parameterized route (customize this)
│   ├── forgot-password.tsx  # Password reset request
│   ├── reset-password.tsx   # Password reset form (token-based)
│   ├── not-found.tsx        # 404 catch-all
│   ├── api.auth.$.ts        # better-auth API handler
│   └── api.health.ts        # Health check endpoint
├── components/
│   └── ui/                  # shadcn/ui + custom components
├── db/
│   ├── index.server.ts      # DB singleton (GlobalThis pattern)
│   ├── schema.ts            # Drizzle schema (auth tables + your tables)
│   └── seed.ts              # Seed script
├── lib/
│   ├── auth.server.ts       # better-auth config
│   ├── auth.client.ts       # Client auth (signIn, signUp, signOut)
│   ├── env.server.ts        # Environment variable validation (Zod)
│   ├── session.server.ts    # requireSession / getOptionalSession
│   ├── schemas.ts           # Zod validation schemas
│   └── utils.ts             # cn() class merge helper
└── stores/
    └── ui-store.ts          # Zustand sidebar state
docs/
├── README.md                # Documentation hub
├── getting-started.md       # Setup and first run
├── routing.md               # React Router v7 conventions
├── database.md              # Drizzle ORM + SQLite
├── authentication.md        # better-auth setup and usage
├── forms.md                 # Conform + Zod patterns
├── styling.md               # Tailwind v4 + shadcn/ui theme
├── ui-patterns.md           # UI patterns (toasts, dialogs, tables)
├── state-management.md      # Server state vs client state
├── testing.md               # Vitest + Testing Library
├── linting.md               # Biome configuration
├── deployment.md            # Docker and production
├── troubleshooting.md       # Common issues and solutions
└── decisions/               # Architecture decision records (ADRs)
```

## Installed Components

**shadcn/ui components** (in `app/components/ui/`):

- alert-dialog, button, dialog, input, label, skeleton, sonner, table

**Custom components** (not from shadcn — also in `app/components/ui/`):

- **confirm-dialog** — Wraps alert-dialog for destructive action confirmation
- **data-table** — Reusable table with typed columns, sorting, and empty state
- **empty-state** — Placeholder for pages/sections with no data (icon + message)
- **error-display** — Renders route errors (404, 500) with friendly messages
- **field-error** — Shows a single validation error below a form input
- **form-error** — Shows form-level errors (e.g., "Invalid credentials") at top
- **form-field** — Wrapper providing consistent spacing for label + input + error
- **navigation-progress** — Animated progress bar during route transitions
- **submit-button** — Button with loading spinner during form submission

Add new shadcn components: `pnpm dlx shadcn@latest add <component>`

## Key Patterns

### App Metadata
- App name and initials are centralized in `app/config.ts`
- All route meta titles and sidebar branding import from `~/config`
- `setup.sh` replaces these values when creating a new project

### Environment Variables
- Validated at startup via `app/lib/env.server.ts` (Zod schema)
- Import `env` from `~/lib/env.server` instead of using raw `process.env`
- Warns in production if `BETTER_AUTH_SECRET` is still the default

### Server-only files
Files ending in `.server.ts` are excluded from client bundles. Use for database
access, auth config, and session helpers.

### Database
- **IMPORTANT: The local `sqlite.db` contains real user data. NEVER run
  `pnpm db:seed` or any command that clears/resets the database without
  explicit user approval.** A backup import script exists at
  `app/db/import-data.ts` if data needs to be restored.
- Schema defined in `app/db/schema.ts` using Drizzle's `sqliteTable`
- Auth tables are managed by better-auth; add your own below them
- GlobalThis singleton prevents multiple connections during HMR
- WAL mode enabled for concurrent reads
- After schema changes: `pnpm db:generate && pnpm db:migrate`

#### Querying with Drizzle

Always import `db` from `~/db/index.server` and tables from `~/db/schema`.
Import operators like `eq` from `drizzle-orm`:

```ts
import { eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { note } from '~/db/schema'

// Select all rows
const allNotes = db.select().from(note).all()

// Select one row by primary key
const found = db.select().from(note).where(eq(note.id, noteId)).get()

// Filter by a column
const userNotes = db.select().from(note)
  .where(eq(note.authorId, userId)).all()

// Insert (returns inserted row with .returning())
const [created] = db.insert(note)
  .values({ title, body, authorId: userId }).returning()

// Update
db.update(note).set({ title: 'New title' })
  .where(eq(note.id, noteId)).run()

// Delete
db.delete(note).where(eq(note.id, noteId)).run()
```

Use `.all()` for multiple rows, `.get()` for one-or-none, `.run()` when you
don't need the result. See `app/routes/notes.tsx` for the complete pattern
inside loaders and actions.

### Authentication
- better-auth handles all auth via `/api/auth/*` splat route
- Server: `requireSession(request)` redirects to `/login` if unauthenticated
- Server: `getOptionalSession(request)` returns session or null
- Client: `signIn.email()`, `signUp.email()`, `signOut()` from `auth.client.ts`

### Forms (Conform + Zod)
- Define schemas in `app/lib/schemas.ts`
- Use `parseWithZod(formData, { schema })` in route actions
- Return `submission.reply()` directly from actions (not wrapped in an object)
- Pass `useActionData()` directly as `lastResult` to `useForm()`
- **Import from `@conform-to/zod/v4`**, not `@conform-to/zod` (required for
  Zod v4 compatibility)
- Use `useForm()` with `onValidate` for client-side validation
- Forms use progressive enhancement (work without JS)
- See `app/routes/login.tsx` as the canonical form example

### Styling & Components
- Tailwind v4 with `:root` + `@theme inline` in `app/app.css`
- shadcn/ui components in `app/components/ui/` (owned source code, not npm)
- OKLCH color tokens using shadcn naming: `background`, `foreground`, `card`,
  `muted`, `destructive`, `accent`, etc.
- Custom tokens: `warning`, `success`, `primary-light`, `destructive-light`, etc.
- `nav-link-active` is a custom CSS class defined in `app/app.css` (not a
  Tailwind utility) — used for sidebar active state
- Use `cn()` from `~/lib/utils` to merge class names
- Config in `components.json` (aliases, style, CSS path)

### State Management
- Server state: React Router loaders/actions (no client cache needed)
- Client UI state: Zustand stores in `app/stores/`

### Route Conventions
- Loaders fetch data, actions handle mutations
- Use `redirect()` for navigation after mutations
- Forward `set-cookie` headers from better-auth responses

### Route Types (Auto-generated)

React Router v7 auto-generates type definitions for each route in
`app/routes/+types/`. These provide typed `LoaderArgs`, `ActionArgs`,
`MetaArgs`, and loader return types. Import them like:

```ts
import type { Route } from './+types/my-route'

export async function loader({ request, params }: Route.LoaderArgs) { ... }
export async function action({ request, params }: Route.ActionArgs) { ... }
export function meta({ data }: Route.MetaArgs) { ... }
```

- Types are generated by `react-router typegen` (runs as part of `pnpm
  typecheck` and during `pnpm dev`)
- The `+types/` directory is gitignored — types are always regenerated
- For parameterized routes (e.g., `notes/:noteId`), `params` is typed with
  the correct parameter names (`params.noteId`)
- Loader return types flow through to `useLoaderData<typeof loader>()`
  automatically
- See `app/routes/notes.$noteId.tsx` for a parameterized route example

## Recipes

### Add a new page

1. Create route file:
   ```
   app/routes/about.tsx
   ```
   Export `meta()`, `loader()` (if needed), and a default component.

2. Register in `app/routes.ts` inside the layout group:
   ```ts
   route('about', 'routes/about.tsx'),
   ```

3. Optionally add a sidebar link in `app/routes/layout.tsx`.

### Add a new form with validation

1. Add a Zod schema to `app/lib/schemas.ts`
2. Create a route with an action that uses `parseWithZod`:
   ```ts
   const submission = parseWithZod(formData, { schema: mySchema })
   if (submission.status !== 'success') return submission.reply()
   ```
3. Use `useForm({ lastResult, onValidate })` in the component
4. Use `<FormField>`, `<Input error={...}>`, `<FieldError>` for form fields
5. See `app/routes/login.tsx` for the complete pattern

### Add a new database table

1. Define the table in `app/db/schema.ts` (below the "Application tables"
   comment):
   ```ts
   export const task = sqliteTable('task', {
     id: integer('id').primaryKey({ autoIncrement: true }),
     title: text('title').notNull(),
     done: integer('done', { mode: 'boolean' }).notNull()
       .$default(() => false),
     userId: text('user_id').notNull()
       .references(() => user.id, { onDelete: 'cascade' }),
     createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
       .$defaultFn(() => new Date()),
   })
   ```
2. Run `pnpm db:generate && pnpm db:migrate`
3. Import and query in server-side loaders/actions:
   ```ts
   import { eq } from 'drizzle-orm'
   import { db } from '~/db/index.server'
   import { task } from '~/db/schema'

   // In a loader:
   const tasks = db.select().from(task)
     .where(eq(task.userId, session.user.id)).all()
   return { tasks }
   ```
4. See the existing `note` table and `app/routes/notes.tsx` as a reference

### Add a new API endpoint

1. Create a route file that exports only `loader` and/or `action` (no default
   component):
   ```
   app/routes/api.my-endpoint.ts
   ```
2. Register **outside** the layout group in `app/routes.ts`:
   ```ts
   route('api/my-endpoint', 'routes/api.my-endpoint.ts'),
   ```

### Add a new shadcn component

```bash
pnpm dlx shadcn@latest add <component-name>
```

This generates into `app/components/ui/`. If the CLI doesn't install
`class-variance-authority`, add it manually: `pnpm add class-variance-authority`

## What to Customize

When starting a new project from this template:

- **`app/config.ts`** — App name and initials (or run `setup.sh`)
- **`app/routes/home.tsx`** — Replace the starter dashboard
- **`app/routes/protected.tsx`** — Replace the example protected page
- **`app/routes/notes.tsx`** and **`notes.$noteId.tsx`** — Replace or remove
  the example CRUD routes (also remove the `note` table from schema)
- **`app/routes/layout.tsx`** — Update sidebar navigation links
- **`app/db/schema.ts`** — Replace the example `note` table with your own
- **`app/db/seed.ts`** — Add seed data for your tables
- **`app/app.css`** — Customize the color tokens in `:root`

**Keep as-is** (infrastructure):

- `app/root.tsx`, `app/routes.ts`, auth routes (`login`, `register`, `logout`,
  `forgot-password`, `reset-password`), API routes, `app/lib/*`, `app/db/index.server.ts`

## Not Included

These are common needs not covered by the template — add as needed:

- **Dark mode** — Light theme only; Sonner is hardcoded to `theme="light"`
- **Email sending** — Password reset logs to console (`auth.server.ts`);
  integrate Resend, Postmark, etc. for production
- **File uploads** — No upload handling or storage
- **Pagination** — No pagination helpers; add per-route as needed
- **Role-based authorization** — Only authenticated/unauthenticated; no roles
- **API rate limiting** — No rate limiting middleware
- **Background jobs** — No job queue or scheduler
- **Real-time** — No WebSocket or SSE support

## Code Style

- No semicolons, single quotes, 2-space indent
- 80 char line width, trailing commas
- Biome handles all formatting and linting
- Run `pnpm lint:fix` before committing
- Path alias: `~/` maps to `app/`

## Testing

- Vitest config is separate from Vite (`vitest.config.ts`)
- Use `// @vitest-environment jsdom` directive for component tests
- Test utils in `test/test-utils.tsx` provide wrapped render with `act()`
- Unit tests don't need the jsdom directive
- Schema tests in `test/schemas.test.ts` validate Zod schemas directly
- Form validation tests in `test/form-validation.test.ts` show how to test
  `parseWithZod` with `FormData` — the same logic used in route actions
- For testing route actions without a database, test the validation layer
  separately (see `test/form-validation.test.ts`)

## Known Issues

- pnpm requires `node-linker=hoisted` in `.npmrc` for React Router SSR
  compatibility (prevents duplicate React instances via symlinks)
- `@conform-to/zod` default export is incompatible with Zod v4 — always use
  the `/v4` subpath import
