# 008 — Testing: Vitest

Date: 2026-02-27

Status: Accepted

## Context

We need a test runner that integrates well with our Vite-based build toolchain.
The main contenders were:

- **Vitest** — A Vite-native test runner
- **Jest** — The established standard in the React ecosystem
- **Bun test** — Bun's built-in test runner

## Decision

We chose Vitest.

Vitest shares Vite's transform pipeline, which means it understands our
TypeScript, path aliases, and Tailwind configuration without additional setup.
Jest would require separate configuration for TypeScript transforms
(ts-jest or @swc/jest), path alias resolution (moduleNameMapper), and potentially
different module resolution behavior.

With Vitest, the test environment matches the development and build environment
because they use the same tool. This eliminates an entire category of "works in
dev but fails in tests" issues.

We pair Vitest with Testing Library for component tests and axe-core for
automated accessibility checks. The `jsdom` environment is opted into per-file
via a directive (`// @vitest-environment jsdom`) rather than globally, which
means unit tests run in the faster Node environment by default.

## Consequences

**Good:**
- Shares Vite's configuration — path aliases, TypeScript, and transforms just
  work
- Fast — leverages Vite's module transformation and esbuild
- Jest-compatible API makes it familiar for most developers
- Per-file environment directives (`@vitest-environment jsdom`) are cleaner
  than global config
- First-class TypeScript support without additional transforms

**Neutral:**
- Vitest 4 is newer, with occasional breaking changes between major versions
- Some Jest plugins don't have Vitest equivalents (though most do)

**Trade-offs:**
- Smaller ecosystem than Jest
- Less documentation and fewer Stack Overflow answers
- If the project ever moves away from Vite, the test setup would need to change
  too
