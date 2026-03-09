# Technology Manifest

> **Generated**: 2026-03-09
> **Last Reviewed**: 2026-03-09
> **Project Status**: Active Development

## Project Overview

**Name**: Friend Focus
**Description**: A personal CRM for tracking friendships — closeness tiers, activities, notes, gift ideas, events, and connection recommendations. Ported from an earlier single-user prototype (friend-tracker) to a multi-user authenticated app.
**Target Users**: Individual users who want to be more intentional about maintaining friendships
**Scale**: Solo project

## Platform & Deployment Target

| Attribute | Value |
|---|---|
| **Platform** | Web |
| **Rendering Strategy** | SSR (React Router v7 framework mode) |
| **PWA Support** | None |
| **Offline Support** | None |
| **Offline Strategy** | N/A |

## Core Technology Stack

### Language & Runtime

| Technology | Version | Role | Rationale |
|---|---|---|---|
| TypeScript | ^5.9.2 | Primary language | Strict mode enabled; type-safe loaders/actions via auto-generated route types |
| Node.js | 22 | Server runtime | LTS version; used in Docker (node:22-alpine) and .nvmrc |

### Framework & Libraries

| Technology | Version | Role | Rationale |
|---|---|---|---|
| React | ^19.2.4 | UI library | Industry standard; required by React Router v7 |
| React Router v7 | 7.12.0 | Full-stack framework (SSR) | Simple loader/action model, progressive enhancement, type-safe routes. Chosen over Next.js (avoids RSC complexity) and TanStack Start (less mature). See [ADR 001](../decisions/001-framework.md) |
| React DOM | ^19.2.4 | DOM renderer | Paired with React 19 |
| Zod | ^4.3.6 | Schema validation | Single schema for client + server validation; used with Conform for forms |
| Conform | ^1.17.1 | Form handling | Progressive enhancement-first; works with React Router's action model. See [ADR 005](../decisions/005-forms.md) |
| Zustand | ^5.0.11 | Client UI state | Minimal, selector-based; server state handled by loaders. See [ADR 006](../decisions/006-state-management.md) |
| Lucide React | ^0.575.0 | Icon library | [Inferred] Lightweight, tree-shakeable SVG icons with React component API |
| Sonner | ^2.0.7 | Toast notifications | Lightweight toast library used via shadcn/ui integration |
| react-force-graph-2d | ^1.29.1 | Connection graph visualization | [Inferred] Used for visualizing friend connection relationships |
| isbot | ^5.1.31 | Bot detection | [Inferred] Used in SSR to detect bots for request handling |

### Build & Dev Tooling

| Technology | Version | Role | Rationale |
|---|---|---|---|
| Vite | ^7.1.7 | Build tool / dev server | React Router v7 requires Vite; fast HMR, native ESM |
| @tailwindcss/vite | ^4.1.13 | Tailwind Vite plugin | CSS-native Tailwind v4 integration; no PostCSS config needed |
| vite-tsconfig-paths | ^5.1.4 | Path alias resolution | Resolves `~/` path alias in both dev and test |
| tsx | ^4.21.0 | TypeScript execution | Used for running scripts like `db:seed` directly |
| @react-router/dev | 7.12.0 | React Router dev tooling | Auto-generates route types in `app/routes/+types/` |

### Styling

| Technology | Version | Role | Rationale |
|---|---|---|---|
| Tailwind CSS | ^4.1.13 (v4) | Utility-first CSS | CSS-native config via `@theme inline` + `:root`; OKLCH color tokens for perceptual uniformity. See [ADR 004](../decisions/004-styling.md) |
| shadcn/ui (new-york style) | Copy-paste (not versioned) | Component library | Owned source code in `app/components/ui/`; built on Radix UI + Tailwind. See [ADR 010](../decisions/010-component-library.md) |
| Radix UI | ^1.4.3 | Accessible primitives | Foundation for shadcn/ui components (Dialog, AlertDialog, etc.) |
| class-variance-authority | ^0.7.1 | Component variant styling | Used by shadcn/ui for variant-based component APIs |
| tailwind-merge | ^3.5.0 | Class name merging | `cn()` utility for safe Tailwind class composition |
| clsx | ^2.1.1 | Conditional class names | Used alongside tailwind-merge in `cn()` utility |
| tw-animate-css | ^1.4.0 | Tailwind animations | Animation utilities for shadcn/ui components |

### State Management

| Technology | Version | Role | Rationale |
|---|---|---|---|
| React Router loaders/actions | 7.12.0 | Server state | All data fetching and mutations via loaders/actions; automatic revalidation |
| Zustand | ^5.0.11 | Client UI state | Single store (`ui-store.ts`) for sidebar state, theme, etc. See [ADR 006](../decisions/006-state-management.md) |

## Infrastructure & Hosting

| Attribute | Value | Rationale |
|---|---|---|
| **Hosting Provider** | Fly.io (https://friend-focus.fly.dev/) | Docker-based deployment with persistent volumes for SQLite; auto-stop reduces cost |
| **CDN** | Fly.io edge (built-in) | [Inferred] Fly.io provides edge TLS termination; no separate CDN configured |
| **Serverless Functions** | N/A | Single long-running Node.js server (not serverless) |
| **Container Orchestration** | Docker (single container on Fly.io) | Multi-stage Dockerfile; single machine constraint due to SQLite |
| **Estimated Monthly Cost** | ~$0-5/mo | [Inferred] Fly.io free tier + auto-stop; shared-cpu-1x 512MB with 1GB volume |
| **Cost Tier at Scale** | Free tier / Budget | Single machine, auto-stop enabled, minimal resource usage |

## Database & Data Layer

| Attribute | Value | Rationale |
|---|---|---|
| **Primary Database** | SQLite (via better-sqlite3 ^12.6.2) | Zero-setup, single-file database; sufficient for single-user/low-traffic app. See [ADR 002](../decisions/002-database.md) |
| **ORM / Query Builder** | Drizzle ORM ^0.45.1 | TypeScript-native schema (no codegen), SQL-like API, Drizzle Kit for migrations. See [ADR 002](../decisions/002-database.md) |
| **Migration Tool** | Drizzle Kit ^0.31.9 | Generates and runs migrations; 7 migrations applied |
| **Caching Layer** | N/A | SQLite is local; no need for external cache |
| **File Storage** | N/A | No file uploads currently |
| **Real-time / Subscriptions** | N/A | Traditional request/response model |
| **Migration Strategy** | Drizzle Kit generate + migrate; auto-run at startup | Migrations run programmatically in `app/db/index.server.ts` on app boot (necessary because Fly.io release_command lacks volume access) |
| **Data Sync Strategy** | N/A | Single-writer SQLite; no replication |

## Authentication & Authorization

| Attribute | Value | Rationale |
|---|---|---|
| **Auth Provider** | better-auth ^1.4.19 | Batteries-included, Drizzle adapter, session management, cookie caching. See [ADR 003](../decisions/003-authentication.md) |
| **Auth Methods** | Email/password, Google OAuth | Email/password out of the box; Google OAuth via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars |
| **Authorization Model** | Simple owner-check (userId FK on all tables) | All application tables scoped by `userId`; queries filtered server-side |
| **Session Strategy** | Cookie-based sessions with 5-minute cookie cache | Signed cookies; cache reduces DB lookups for session verification |
| **MFA Support** | No | [Inferred] Not currently implemented; better-auth supports it via plugins |
| **Password Reset** | Email via Resend (console fallback in dev) | `RESEND_API_KEY` env var; falls back to console logging without it |

## External Dependencies & APIs

| Service | Purpose | Criticality | Rationale |
|---|---|---|---|
| Google OAuth | Social sign-in + account linking | Nice-to-have | Optional; app works without it (email/password only) |
| Google Calendar API | Event creation and sync | Important | Calendar integration for friend events; requires Google OAuth tokens |
| Google Contacts API | Contact import and sync | Nice-to-have | Import friends from Google Contacts; diff-based sync |
| Google Places API | Address autocomplete | Nice-to-have | `GOOGLE_MAPS_API_KEY` env var; falls back to plain text input |
| Resend | Transactional email (password reset) | Nice-to-have | `RESEND_API_KEY` env var; falls back to console logging in dev |
| Fly.io | Hosting / deployment | Critical | Docker deploy on push to main; persistent volume for SQLite |

## Testing Strategy

| Layer | Technology | Coverage | Rationale |
|---|---|---|---|
| **Unit** | Vitest ^4.0.18 | Medium (28 test files) | Vite-native runner; shares build config. See [ADR 008](../decisions/008-testing.md) |
| **Component** | Testing Library (React ^16.3.2) + jsdom ^28.1.0 | Medium | Per-file `@vitest-environment jsdom` directive; test utils with `act()` wrapper |
| **Accessibility** | axe-core ^4.11.1 | Low | [Inferred] Available as dev dependency; used in select component tests |
| **Integration** | Vitest (form validation tests) | Low | Route action validation tested without DB via `parseWithZod` |
| **E2E** | N/A | None | No end-to-end test framework configured |
| **Visual Regression** | N/A | None | No visual regression testing |

## CI/CD & DevOps

| Attribute | Value | Rationale |
|---|---|---|
| **CI Platform** | GitHub Actions | Single workflow: deploy to Fly.io on push to `main` |
| **Deployment Strategy** | Auto-deploy on merge to `main`; rolling deploy on Fly.io | `fly deploy --remote-only` via GitHub Actions; `deploy.strategy = "rolling"` in fly.toml |
| **Pre-commit Hooks** | Husky ^9.1.7 + lint-staged ^16.2.7 | Pre-commit: `biome check --write` on staged files. Pre-push: `pnpm typecheck && pnpm test` |
| **Monitoring & Logging** | Fly.io logs (`fly logs`) | No external monitoring (Sentry, etc.) configured |
| **Feature Flags** | N/A | No feature flag system |

## Monorepo & Package Architecture

| Attribute | Value | Rationale |
|---|---|---|
| **Repo Structure** | Single app | One application, one deployment target |
| **Monorepo Tool** | N/A | `pnpm-workspace.yaml` exists but no workspace packages defined |
| **Shared Packages** | N/A | All code lives in `app/` |

## Accessibility & Internationalization

| Attribute | Value | Rationale |
|---|---|---|
| **Accessibility Standard** | Partial (WCAG 2.1 AA goal) | Biome a11y lint rules enabled; Radix UI primitives provide keyboard nav + ARIA; axe-core available for testing |
| **i18n Support** | None | English only; no internationalization library |
| **i18n Library** | N/A | N/A |

## Pain Points & Retrospective

> This section captures honest reflections. Items marked [Inferred] are based on code inspection and should be verified by the project owner.

### What Worked Well
- [Inferred] **React Router v7 loader/action model** — Simple, predictable data flow with automatic revalidation; no client cache to manage
- [Inferred] **Drizzle ORM + SQLite** — Zero-setup database; TypeScript schema definitions eliminate codegen step; fast development iteration
- [Inferred] **better-auth** — Drop-in auth with Drizzle adapter; cookie caching keeps latency low
- [Inferred] **shadcn/ui** — Owned component source code avoids version lock-in; Radix primitives handle accessibility
- [Inferred] **Biome** — Single tool replacing ESLint + Prettier; fast and minimal config
- [Inferred] **ADR documentation** — 10 well-written decision records capture rationale for every major choice

### What Didn't Work Well
- [Inferred] **pnpm + React Router SSR compatibility** — Required `node-linker=hoisted` in `.npmrc` to avoid duplicate React instances, negating some of pnpm's strictness benefits
- [Inferred] **Conform + Zod v4 import path** — Must use `@conform-to/zod/v4` subpath; the default export causes confusing build errors (documented in ADR 005 and CLAUDE.md)
- [Inferred] **No E2E tests** — 28 unit/component test files but no end-to-end testing framework; critical user flows (login, friend CRUD, Google OAuth) are untested end-to-end
- [Inferred] **No CI checks before deploy** — The GitHub Actions workflow deploys directly on push to `main` without running lint/typecheck/test in CI (relies on pre-push hooks locally)

### Known Technical Debt
- [Inferred] **No external monitoring** — No Sentry, LogRocket, or similar error tracking in production; errors are only visible via `fly logs`
- [Inferred] **Single-machine SQLite constraint** — Cannot horizontally scale; sufficient for current usage but limits future growth
- [Inferred] **No preview deploys** — PRs are not deployed to preview environments for testing before merge

### If Starting Over, I Would...
- *[To be filled in by the project owner based on lived experience]*

## Key Decisions & Tradeoffs

> All major decisions are documented as ADRs in `docs/decisions/`. Summary below.

### React Router v7 over Next.js
- **Context**: Needed a full-stack React framework with SSR
- **Decision**: React Router v7 in framework mode
- **Alternatives Considered**: Next.js (App Router), TanStack Start
- **Tradeoffs**: Simpler mental model (no RSC), but smaller community and fewer third-party examples
- **Outcome**: Simple, predictable data loading; type-safe routes via auto-generated types
- **ADR**: [001-framework.md](../decisions/001-framework.md)

### SQLite over PostgreSQL
- **Context**: Needed a database with zero setup friction
- **Decision**: SQLite via better-sqlite3 with Drizzle ORM
- **Alternatives Considered**: Prisma + PostgreSQL, Kysely + SQLite
- **Tradeoffs**: No external DB server needed, but limited to single-machine deployment; no JSONB, arrays, or RLS
- **Outcome**: Friction-free development; sufficient for single-user app
- **ADR**: [002-database.md](../decisions/002-database.md)

### better-auth over Auth.js
- **Context**: Needed session-based auth with Drizzle integration
- **Decision**: better-auth with email/password + Google OAuth
- **Alternatives Considered**: lucia-auth (deprecated), Auth.js, rolling our own
- **Tradeoffs**: Newer library with smaller community, but framework-agnostic and works naturally with React Router
- **Outcome**: Cookie caching keeps latency low; plugin system available for future auth methods
- **ADR**: [003-authentication.md](../decisions/003-authentication.md)

### Tailwind CSS v4 with OKLCH tokens
- **Context**: Needed productive, customizable styling
- **Decision**: Tailwind v4 with CSS-native config and OKLCH color tokens
- **Alternatives Considered**: CSS Modules, Styled Components, Panda CSS
- **Tradeoffs**: OKLCH has limited browser dev tools support; Tailwind v4 is newer with less community content
- **Outcome**: Semantic tokens make rebranding trivial; no runtime CSS overhead
- **ADR**: [004-styling.md](../decisions/004-styling.md)

### Conform over react-hook-form
- **Context**: Needed forms with progressive enhancement (work without JS)
- **Decision**: Conform with Zod for validation
- **Alternatives Considered**: react-hook-form + Zod, manual FormData handling
- **Tradeoffs**: Smaller community, unfamiliar API, but native progressive enhancement
- **Outcome**: Forms work without JavaScript; single Zod schema for client + server validation
- **ADR**: [005-forms.md](../decisions/005-forms.md)

### Biome over ESLint + Prettier
- **Context**: Needed linting and formatting with minimal config
- **Decision**: Biome as a single tool for both
- **Alternatives Considered**: ESLint + Prettier, oxlint + Prettier
- **Tradeoffs**: No custom rule support or ESLint plugin ecosystem, but one config file, one dependency
- **Outcome**: Simple, fast, comprehensive defaults including a11y rules
- **ADR**: [007-linting.md](../decisions/007-linting.md)
