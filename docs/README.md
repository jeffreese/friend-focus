# Friend Focus Documentation

This is the documentation hub for Friend Focus. Whether you're
onboarding or trying to understand why we made certain choices, you'll find
what you need here.

## Getting Started

New to the template? Start here:

- [**Getting Started**](./getting-started.md) — Clone, setup, and first run
- [**Development Workflow**](./development-workflow.md) — Branching, PRs,
  testing, commit conventions

## Topic Guides

These guides explain how each piece of the template works and how to customize
it for your project.

- [**Routing**](./routing.md) — React Router v7 conventions, loaders, actions
- [**Database**](./database.md) — Drizzle ORM, SQLite, migrations, seeding
- [**Authentication**](./authentication.md) — better-auth setup, sessions,
  protected routes
- [**Forms**](./forms.md) — Conform + Zod, progressive enhancement, validation
- [**Styling**](./styling.md) — Tailwind CSS v4, OKLCH color system, theming
- [**UI Patterns**](./ui-patterns.md) — Toasts, dialogs, form errors, loading
  states, tables, empty states
- [**State Management**](./state-management.md) — Server state vs client state,
  Zustand
- [**Testing**](./testing.md) — Vitest, Testing Library, writing tests
- [**Linting & Formatting**](./linting.md) — Biome configuration and usage
- [**Deployment**](./deployment.md) — Docker, environment variables, production
- [**Troubleshooting**](./troubleshooting.md) — Common issues and solutions

## Decisions

We've documented the reasoning behind every major technology choice. If you're
wondering "why X instead of Y?", these are for you.

- [**001 — Framework: React Router v7**](./decisions/001-framework.md)
- [**002 — Database: Drizzle + SQLite**](./decisions/002-database.md)
- [**003 — Authentication: better-auth**](./decisions/003-authentication.md)
- [**004 — Styling: Tailwind CSS v4**](./decisions/004-styling.md)
- [**005 — Forms: Conform + Zod**](./decisions/005-forms.md)
- [**006 — State: Zustand**](./decisions/006-state-management.md)
- [**007 — Linting: Biome**](./decisions/007-linting.md)
- [**008 — Testing: Vitest**](./decisions/008-testing.md)
- [**009 — Package Manager: pnpm**](./decisions/009-package-manager.md)
- [**010 — Component Library: shadcn/ui**](./decisions/010-component-library.md)

## Contributing

If you're modifying this template itself (not just using it as a starting
point), please update the relevant documentation when you make changes. If
you're adding a new technology or replacing an existing one, write a decision
document explaining why.
