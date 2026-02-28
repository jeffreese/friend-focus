# Deployment

The app is deployed to **Fly.io** using Docker with a persistent volume for
SQLite. The production URL is **https://friend-focus.fly.dev/**.

## Fly.io

### Prerequisites

- [flyctl](https://fly.io/docs/flyctl/install/) CLI installed
- Fly.io account with billing configured

### Configuration

- **`fly.toml`** — App config (region, volume mount, health checks, VM size)
- **Region:** `ord` (Chicago)
- **VM:** `shared-cpu-1x` with 512MB RAM
- **Volume:** `ff_data` (1GB) mounted at `/data`
- **Database path:** `/data/sqlite.db` (on persistent volume)
- **Auto-stop:** Enabled — machine sleeps when idle, wakes on request

### Deploying

**Automatic:** Merging to `main` triggers a GitHub Actions deploy. CI checks
(lint, typecheck, test, build) must pass first. See `.github/workflows/ci.yml`.

**Manual:** Run `fly deploy` from the project root.

Both methods build the Docker image on Fly's remote builders and update the
running machine. Database migrations run automatically on startup (see
`app/db/index.server.ts`), so no manual migration step is needed.

### Useful Commands

```bash
fly status          # Check app and machine status
fly logs            # Stream application logs
fly ssh console     # SSH into the running machine
fly open            # Open the app in your browser
fly volumes list    # List volumes and their status
fly secrets list    # List secret names (values hidden)
```

### Secrets

Sensitive environment variables are stored as Fly.io secrets (not in
`fly.toml`):

```bash
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set BETTER_AUTH_URL=https://friend-focus.fly.dev
```

Non-sensitive env vars (`NODE_ENV`, `DATABASE_URL`, `PORT`) are in the `[env]`
section of `fly.toml`.

### Database Migrations

Drizzle migrations run programmatically at app startup via `migrate()` in
`app/db/index.server.ts`. This is necessary because Fly.io's `release_command`
runs in a temporary machine without volume access. Migrations are idempotent —
already-applied migrations are skipped instantly.

### Important Constraints

- **Single machine only.** SQLite is a single-writer database. Never scale
  beyond 1 machine (`fly scale count 1`).
- **Volume is single-region.** The `ff_data` volume only exists in `ord`. The
  machine must run in the same region.
- **Volume persists across deploys** but is tied to the machine. If the machine
  is destroyed, the volume survives and will be reattached.

### Initial Setup (already done)

For reference, the initial setup was:

```bash
fly auth login
fly apps create friend-focus
fly volumes create ff_data --region ord --size 1
fly secrets set \
  BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  BETTER_AUTH_URL=https://friend-focus.fly.dev
fly deploy
```

## Docker (Local)

The `Dockerfile` uses a multi-stage build to keep the production image small:

1. **Base** — Node 22 Alpine with pnpm enabled via corepack
2. **Dependencies** — Installs production dependencies
3. **Build** — Runs the production build
4. **Production** — Copies only what's needed to run

Build and run locally:

```bash
docker build -t friend-focus .
docker run -p 3000:3000 \
  -v ./data:/app/data \
  -e DATABASE_URL=data/sqlite.db \
  -e BETTER_AUTH_SECRET=your-secret-here \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  friend-focus
```

## Environment Variables

Environment variables are validated at startup using Zod (see
`app/lib/env.server.ts`). If a required variable is missing or invalid, the app
will fail to start with a clear error message.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite.db` | Path to the SQLite database file |
| `BETTER_AUTH_SECRET` | Yes | — | Secret key for signing session cookies |
| `BETTER_AUTH_URL` | No | `http://localhost:5173` | Public URL of the application |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |

A warning is logged if `BETTER_AUTH_SECRET` is still the default value in
production.

## Production Build

Without Docker, you can build and run directly:

```bash
pnpm build
pnpm start
```

The production server runs on port 3000 by default.

## Health Check

A health check endpoint at `/api/health` verifies the database connection:

```bash
curl https://friend-focus.fly.dev/api/health
# {"status":"ok","timestamp":"2026-02-27T..."}
```

Returns 200 with `{"status": "ok"}` when healthy, or 500 with
`{"status": "error"}` if the database is unreachable. Fly.io checks this
endpoint every 30 seconds.
