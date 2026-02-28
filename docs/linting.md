# Linting & Formatting

We use [Biome](https://biomejs.dev/) as a single tool for both linting and
formatting. It replaces the traditional ESLint + Prettier combination with
one fast, zero-config tool.

## Commands

```bash
pnpm lint      # Check for lint errors and formatting issues
pnpm lint:fix  # Auto-fix everything
pnpm format    # Format only (no lint fixes)
```

Run `pnpm lint:fix` before committing to keep everything consistent.

## Configuration

The Biome config lives in `biome.json`. Our formatting preferences:

- No semicolons
- Single quotes
- 2-space indentation
- 80 character line width
- Trailing commas

## What Biome Checks

Biome's linter includes rules from several categories:

- **Correctness** — Catches actual bugs (unused variables, unreachable code)
- **Suspicious** — Flags code that's likely wrong (duplicate keys, confusing
  syntax)
- **Style** — Enforces consistent patterns (const over let when possible)
- **A11y** — Accessibility checks (alt text, label associations)
- **Security** — Basic security checks (no dangerouslySetInnerHTML)

We use the `"recommended"` ruleset with a few overrides for our specific
needs. The disabled rules and their reasons are documented in `biome.json`.

## Tailwind Support

Biome's CSS parser has been configured to understand Tailwind directives
(`@theme`, `@apply`, `@import 'tailwindcss'`). This is set via
`css.parser.tailwindDirectives: true` in `biome.json`.

## Editor Integration

Biome has plugins for most editors:

- **VS Code**: Install the
  [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- **Neovim**: Use the built-in LSP client with Biome's language server
- **JetBrains**: Install the Biome plugin from the marketplace

Set Biome as your default formatter and enable format-on-save for the best
experience.

## Why Biome?

See [Decision 007 — Linting](./decisions/007-linting.md) for why we chose Biome
over ESLint + Prettier.
