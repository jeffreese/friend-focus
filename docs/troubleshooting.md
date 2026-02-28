# Troubleshooting

Common issues and their solutions.

## Database

### "database is locked" error

SQLite only allows one writer at a time. This can happen if multiple processes
try to write simultaneously (e.g., concurrent form submissions during dev).

**Fix:** WAL mode is already enabled in `app/db/index.server.ts`, which helps.
If you still see this error, check for:

- Multiple `pnpm dev` processes running (kill extras)
- Drizzle Studio open while the dev server is running (Studio locks the DB
  for writes)
- A stale `sqlite.db-wal` or `sqlite.db-shm` file after a crash — restart
  the dev server to recover

### Migration drift after switching branches

If you switch branches and the database schema doesn't match, you'll see
errors like "no such column" or "table already exists".

**Fix:** Run `pnpm db:push` to sync the schema with the current branch's
`schema.ts`. This is safe in development (it won't delete data unless
columns were removed). For production, always use `pnpm db:generate &&
pnpm db:migrate`.

### "Cannot find module '~/db/index.server'" in tests

Server-only files (`.server.ts`) can't be imported in test files that run
in the default Node environment because they may depend on the Vite module
resolution.

**Fix:** For testing database logic, either:

- Test the Zod schemas and validation separately (see
  `test/form-validation.test.ts`)
- Mock the database module in your test with `vi.mock('~/db/index.server')`

## TypeScript

### "Cannot find module './+types/my-route'"

The `+types/` directory is auto-generated. If types are missing:

**Fix:** Run `pnpm typecheck` (which runs `react-router typegen` first) or
start the dev server with `pnpm dev` (typegen runs on startup). The
`+types/` directory is gitignored and regenerated automatically.

### Type errors after adding a new route

After creating a new route file and registering it in `app/routes.ts`, you
may see type errors for the Route import.

**Fix:** Run `pnpm typecheck` to regenerate types, or restart the dev server.
The typegen needs to see the updated `routes.ts` before it can generate the
new route's types.

## React Router / Vite

### HMR not working / page doesn't update

If hot module replacement stops working and changes don't appear:

**Fix:**

1. Check the terminal for build errors
2. Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Restart the dev server (`pnpm dev`)
4. Clear the Vite cache: `rm -rf node_modules/.vite` and restart

### "Multiple instances of React detected"

This typically happens when pnpm's default symlink-based `node_modules`
creates duplicate React packages.

**Fix:** The `.npmrc` file should contain `node-linker=hoisted`. If it
doesn't, add it and run `pnpm install` again. See the Known Issues section
in CLAUDE.md.

### Styles not applying after adding a Tailwind class

Tailwind v4 uses a JIT compiler. If a class isn't being applied:

**Fix:**

- Make sure you're using the class in a `.tsx` file (Tailwind scans these
  for class names)
- Check that the class exists in Tailwind v4 (some v3 classes were renamed)
- For custom CSS variables, verify they're defined in `app/app.css` under
  `:root` and registered in `@theme inline`

## Dependencies

### "Cannot find module" after `git pull`

New dependencies may have been added that aren't installed locally.

**Fix:** Run `pnpm install` after pulling changes.

### shadcn CLI doesn't install `class-variance-authority`

Some shadcn/ui components need `class-variance-authority` but the CLI
doesn't always install it.

**Fix:** Install it manually: `pnpm add class-variance-authority`

## Auth

### "Failed to get session" or session is always null

**Fix:**

- Ensure the `set-cookie` header is forwarded from better-auth responses.
  See the login action in `app/routes/login.tsx` for the pattern:
  ```ts
  const headers = new Headers()
  const setCookie = result.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  return redirect('/', { headers })
  ```
- Check that `BETTER_AUTH_URL` in `.env` matches the actual server URL
  (e.g., `http://localhost:5173`)
- Check that `BETTER_AUTH_SECRET` is set in `.env`

### Password reset emails not sending

The template logs password reset URLs to the console instead of sending
emails.

**Fix:** This is intentional for development. For production, integrate an
email service (Resend, Postmark, etc.) in `app/lib/auth.server.ts` in the
`sendResetPassword` callback.
