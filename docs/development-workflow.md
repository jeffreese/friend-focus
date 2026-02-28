# Development Workflow

This documents our development process — how we go from an idea to merged code.

## Implementation Plans

For non-trivial features (multi-step work, new pages, data model changes),
create an implementation plan before writing code. This is especially important
for work that spans multiple sessions with AI assistance.

### When to create a plan

- Adding a new feature with multiple routes, components, and server logic
- Porting functionality from another project
- Refactoring across many files
- Any work expected to take more than one coding session

### Plan structure

1. **Explore** the existing codebase and any reference code
2. **Design** the implementation approach — data model, routes, components
3. **Create a tracker** in Claude's project memory
   (`implementation-tracker.md`) with checkboxes for each phase and task
4. **Work in phases** — complete one phase at a time, commit after each
5. **Update the tracker** as work progresses so the next session can pick up
   where you left off

### Multi-session workflow

When work spans multiple sessions:

1. Check the implementation tracker for current status
2. Read the session log to understand what was done and what's next
3. Pick up from the next incomplete phase
4. Commit completed work before ending the session
5. Update the tracker with a session log entry

The tracker lives in Claude's project memory so it persists across
conversations. It should include:

- Phase-by-phase checklist with completion status
- Key decisions made during implementation
- Session log with dates and what was accomplished
- Pointer to the working branch

## Branch Workflow

All changes go through pull requests. Never push directly to `main`.

### Starting Work

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Use descriptive branch names: `feature/add-user-profiles`,
`fix/login-redirect-loop`, `docs/update-auth-guide`.

### During Development

1. Write the code
2. Write or update tests — all features must have tests
3. Update any relevant documentation (topic guides, ADRs, CLAUDE.md)
4. Run pre-commit checks (see below)
5. Commit with a clear message

### Finishing Work

```bash
git push -u origin feature/short-description
gh pr create --title "Add user profiles" --body "..."
```

After the PR is approved and merged:

```bash
git checkout main
git pull origin main
git branch -d feature/short-description
```

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on
every push to `main` and on pull requests. It runs:

1. `pnpm lint` — Biome lint checks (no auto-fix — CI should fail on errors)
2. `pnpm typecheck` — TypeScript type checking
3. `pnpm test` — All Vitest tests
4. `pnpm build` — Production build

All four must pass before a PR can be merged. The workflow uses Node 22 with
pnpm via corepack and caches the pnpm store for fast installs.

## Pre-Commit Checks

Before committing, run these to catch issues early:

```bash
pnpm lint:fix     # Format and fix lint issues
pnpm typecheck    # Ensure no type errors
pnpm test         # Ensure tests pass
```

All three should pass before pushing. If you're making a work-in-progress
commit on your branch, at minimum run `pnpm lint:fix`.

## Commit Messages

Write commit messages that explain **why**, not just what. Use this format:

```
Short summary of the change (imperative mood, <70 chars)

Optional longer description explaining the motivation, approach,
or any non-obvious decisions. Wrap at 80 characters.
```

Examples of good commit messages:
- `Add user profile page with avatar upload`
- `Fix redirect loop when session cookie expires`
- `Replace axios with native fetch for API calls`

Examples of bad commit messages:
- `update stuff`
- `fix bug`
- `WIP`

## Testing Requirements

All features must have tests. The type of test depends on what you're building:

| What you built | What to test |
|---------------|-------------|
| Utility function | Unit test (`test/*.test.ts`) |
| UI component | Component test with Testing Library (`test/*.test.tsx`) |
| Form with validation | Test the Zod schema, test the action with invalid/valid data |
| New route with loader | Test the loader returns expected data |
| Database query | Test the query against a test database |

If you're unsure what to test, focus on behavior that matters to users — can
they complete the task the feature enables?

See [Testing](./testing.md) for details on writing tests.

## Documentation Updates

When you change code, update the relevant documentation:

- **Changed how a feature works?** Update the topic guide in `docs/`
- **Replaced a technology?** Write a new ADR in `docs/decisions/` and mark the
  old one as "Superseded"
- **Changed project structure?** Update the structure trees in `CLAUDE.md` and
  `docs/getting-started.md`
- **Added a new pattern?** Document it in the relevant topic guide and add it to
  `CLAUDE.md` under Key Patterns
- **Changed commands?** Update `CLAUDE.md` Quick Reference and
  `docs/getting-started.md`

Documentation should always reflect the current state of the code.

## Database Changes

There are two workflows for schema changes:

### During development (exploratory)

When you're still figuring out the schema:

```bash
# Edit app/db/schema.ts
pnpm db:push        # Apply changes directly (no migration files)
```

This is fast but doesn't create a migration history.

### For production-ready changes

When the schema is finalized:

```bash
# Edit app/db/schema.ts
pnpm db:generate    # Create migration files in drizzle/
pnpm db:migrate     # Apply the migration
```

Always use `db:generate` + `db:migrate` for changes that will be committed.
Migration files should be included in the PR so reviewers can see what's
changing in the database.

## Adding Dependencies

When adding a new package:

```bash
pnpm add package-name           # Runtime dependency
pnpm add -D package-name        # Dev dependency
```

Before adding a dependency, consider:
- Is there already something in the project that does this?
- Is the package actively maintained?
- How large is it? (check on [bundlephobia.com](https://bundlephobia.com/))
- Does it have TypeScript types?

When replacing a dependency with something new, write an ADR explaining why.

## Pull Request Format

PRs should include:

```markdown
## Summary
Brief description of what this PR does and why.

## Changes
- Bullet list of specific changes

## Test plan
- How to verify this works
- What tests were added
```

Keep PRs focused — one feature or fix per PR. If a PR touches unrelated things,
split it up.
