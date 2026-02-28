# 007 — Linting: Biome

Date: 2026-02-27

Status: Accepted

## Context

We need linting and formatting tools that enforce consistent code style. The
main contenders were:

- **Biome** — A single tool for formatting and linting, written in Rust
- **ESLint** + **Prettier** — The traditional combination
- **ESLint** (with stylistic rules) — ESLint handling both linting and
  formatting
- **oxlint** + Prettier — A newer Rust-based linter with Prettier for formatting

## Decision

We chose Biome.

Biome replaces both ESLint and Prettier with a single tool. One config file, one
dependency, one command. It's written in Rust and is significantly faster than
ESLint + Prettier (though speed is less important than simplicity for a
template).

The real benefit is reduced configuration. ESLint + Prettier requires
coordinating two tools that can conflict with each other. You need
`eslint-config-prettier` to disable ESLint rules that Prettier handles,
`eslint-plugin-*` packages for TypeScript and React, and careful configuration
to avoid rule conflicts. Biome handles all of this internally.

Biome's default rules are sensible and comprehensive. The `"recommended"` preset
covers correctness, suspicious patterns, style, accessibility, and security.

## Consequences

**Good:**
- Single tool replaces ESLint + Prettier
- One config file (`biome.json`), one dependency
- Fast — Rust-based, handles large codebases quickly
- Includes accessibility and security lint rules out of the box
- CSS and JSON formatting included

**Neutral:**
- Biome's rule names differ from ESLint's, which can confuse developers who
  are used to ESLint
- Plugin ecosystem is smaller than ESLint's

**Trade-offs:**
- No custom rule support (ESLint's plugin system is more extensible)
- Some ESLint plugins (like `eslint-plugin-react-hooks`) don't have Biome
  equivalents yet
- Newer tool with a smaller community than ESLint
- If a team needs a very specific ESLint plugin, they'd need to switch back
