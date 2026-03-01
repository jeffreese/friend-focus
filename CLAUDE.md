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
3. Git hooks handle checks automatically (see below), but you can also run manually:
   `pnpm lint:fix && pnpm typecheck && pnpm test`
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

## Key Patterns

### App Metadata
- App name and initials are centralized in `app/config.ts`
- All route meta titles and sidebar branding import from `~/config`

### Environment Variables
- Validated at startup via `app/lib/env.server.ts` (Zod schema)
- Import `env` from `~/lib/env.server` instead of using raw `process.env`
- `GOOGLE_MAPS_API_KEY` (optional): enables Google Places address
  autocomplete on the friend form. Without it the field falls back to
  plain text input.

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
- After schema changes: `pnpm db:generate && pnpm db:migrate`
- Import `db` from `~/db/index.server`, tables from `~/db/schema`,
  operators like `eq` from `drizzle-orm`
- Use `.all()` for multiple rows, `.get()` for one-or-none, `.run()` when
  you don't need the result
- See `docs/database.md` for full query examples and migration workflow

### Authentication
- better-auth handles all auth via `/api/auth/*` splat route
- Server: `requireSession(request)` redirects to `/login` if unauthenticated
- Server: `getOptionalSession(request)` returns session or null
- Client: `signIn.email()`, `signUp.email()`, `signOut()` from `auth.client.ts`
- Google OAuth: configured via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  env vars (optional — app works without them)
- Social sign-in: `authClient.signIn.social({ provider: 'google' })`
- Account linking: `authClient.linkSocial({ provider: 'google' })`
- Google token helper: `app/lib/google.server.ts` for Calendar/Contacts API access

### Forms (Conform + Zod)
- Define schemas in `app/lib/schemas.ts`
- Use `parseWithZod(formData, { schema })` in route actions
- Return `submission.reply()` directly from actions (not wrapped in an object)
- Pass `useActionData()` directly as `lastResult` to `useForm()`
- **Import from `@conform-to/zod/v4`**, not `@conform-to/zod` (required for
  Zod v4 compatibility)
- Forms use progressive enhancement (work without JS)
- See `docs/forms.md` for complete patterns and `app/routes/login.tsx` as
  the canonical example

### Styling & Components
- Tailwind v4 with `:root` + `@theme inline` in `app/app.css`
- shadcn/ui components in `app/components/ui/` (owned source code, not npm)
- OKLCH color tokens using shadcn naming: `background`, `foreground`, `card`,
  `muted`, `destructive`, `accent`, etc.
- Custom tokens: `warning`, `success`, `primary-light`, `destructive-light`, etc.
- `nav-link-active` is a custom CSS class defined in `app/app.css` (not a
  Tailwind utility) — used for sidebar active state
- Use `cn()` from `~/lib/utils` to merge class names
- Add new shadcn components: `pnpm dlx shadcn@latest add <component>`
- **IMPORTANT: Always use existing components from `app/components/ui/` instead
  of writing raw HTML/Tailwind for the same purpose.** Before building any UI,
  check what components already exist (e.g., `PageHeader`, `SectionCard`,
  `FormField`, `FieldError`, `FormError`, `EmptyState`, `StatusBadge`,
  `SubmitButton`, `BackLink`, `DataTable`, etc.). If a reusable pattern
  emerges that doesn't have a component yet, create one in `app/components/ui/`.
  The goal is DRY, consistent UI that's easy to theme and modify globally.

### Route Conventions
- Loaders fetch data, actions handle mutations
- Use `redirect()` for navigation after mutations
- Forward `set-cookie` headers from better-auth responses
- Register page routes inside the layout group in `app/routes.ts`;
  register API routes outside it
- See `docs/routing.md` for full conventions

### Route Types (Auto-generated)
- React Router v7 auto-generates types in `app/routes/+types/` (gitignored)
- Import as: `import type { Route } from './+types/my-route'`
- Use `Route.LoaderArgs`, `Route.ActionArgs`, `Route.MetaArgs`
- Parameterized routes get typed `params` (e.g., `params.noteId`)

### State Management
- Server state: React Router loaders/actions (no client cache needed)
- Client UI state: Zustand stores in `app/stores/`

## Git Hooks

Husky + lint-staged enforce quality automatically:

- **Pre-commit**: `lint-staged` runs `biome check --write` on staged files
  (formats + lints only what you changed — fast)
- **Pre-push**: runs `pnpm typecheck && pnpm test` (catches type errors and
  test failures before they hit CI)

Hooks are installed automatically via `pnpm install` (the `prepare` script).
To skip hooks in an emergency: `git commit --no-verify` / `git push --no-verify`

## Code Style

- No semicolons, single quotes, 2-space indent
- 80 char line width, trailing commas
- Biome handles all formatting and linting
- Lint-staged auto-fixes on commit; you can also run `pnpm lint:fix` manually
- Path alias: `~/` maps to `app/`

## Testing

- Vitest config is separate from Vite (`vitest.config.ts`)
- Use `// @vitest-environment jsdom` directive for component tests
- Unit tests don't need the jsdom directive
- Test utils in `test/test-utils.tsx` provide wrapped render with `act()`
- For testing route actions without a database, test the validation layer
  separately (see `test/form-validation.test.ts`)

## Known Issues

- pnpm requires `node-linker=hoisted` in `.npmrc` for React Router SSR
  compatibility (prevents duplicate React instances via symlinks)
- `@conform-to/zod` default export is incompatible with Zod v4 — always use
  the `/v4` subpath import
