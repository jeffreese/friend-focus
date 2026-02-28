# 010 — Component Library: shadcn/ui

## Status

Accepted

## Context

The template needs common UI patterns: toast notifications, confirmation
dialogs, loading states, form error display, empty states, and data tables.
Building these from scratch is time-consuming and error-prone — especially for
accessibility (focus traps, keyboard navigation, screen reader support).

We evaluated three approaches:

1. **Hand-built components** — full control, but significant effort to get
   accessibility right for complex widgets like dialogs and toasts.

2. **Headless libraries (Radix UI)** — accessible primitives without styling,
   but still requires building the styled layer from scratch.

3. **shadcn/ui** — a copy-paste component library built on Radix UI + Tailwind
   CSS. Components are generated into your project as source code you own. Not
   an npm dependency — no version lock-in.

## Decision

Adopt **shadcn/ui** as the component library foundation.

## Reasoning

- **We own the code.** Components are copied into `app/components/ui/` as
  editable source files, not imported from `node_modules`. No version
  conflicts, no breaking upgrades, full customization.

- **Built on proven accessibility primitives.** shadcn/ui uses Radix UI
  underneath, which provides WAI-ARIA compliant focus management, keyboard
  navigation, and screen reader support out of the box.

- **Native Tailwind CSS v4 support.** shadcn/ui supports Tailwind v4's
  `@theme inline` + `:root` variable pattern and uses OKLCH colors, matching
  our existing approach.

- **React Router v7 support.** The shadcn CLI detects React Router v7
  framework mode and configures accordingly (`rsc: false`, correct aliases).

- **Consistent component API.** All components follow the same patterns
  (`data-slot` attributes, `cn()` for class merging, `React.ComponentProps`
  typing), making the codebase predictable.

- **Easy to extend.** Need a new component? `pnpm dlx shadcn@latest add
  <name>` generates it. The CLI maintains `components.json` for configuration.

## What We Use

**From shadcn/ui (generated):**
- Button, Input, Label — base form controls
- Dialog — modal with focus trap and backdrop
- AlertDialog — confirmation dialog (prevents accidental close)
- Sonner (toast) — lightweight toast notifications
- Skeleton — loading state placeholder
- Table — styled semantic HTML table

**Custom components (built on top):**
- FormError — form-level error banner
- FieldError — field-level error message
- ConfirmDialog — simplified AlertDialog wrapper
- SubmitButton — button with pending/loading state
- EmptyState — empty data display with icon and CTA
- DataTable — sortable data table with empty state

## Trade-offs

- **Adds dependencies:** `radix-ui`, `class-variance-authority`, `sonner`,
  `tw-animate-css`. These are lightweight and well-maintained.

- **Theme migration:** We renamed our color tokens to match shadcn's
  conventions (`surface` → `background`, `danger` → `destructive`,
  `text-muted` → `muted-foreground`, etc.). This is a one-time cost that
  aligns us with a large ecosystem.

- **Generated code to maintain:** The shadcn components in `components/ui/`
  are source files we own. They don't auto-update — which is the point (no
  surprise breakage), but means we handle any desired updates manually.

## Alternatives Considered

- **Radix UI directly** — More manual work for styling and composition.
  shadcn/ui gives us this for free while keeping the same Radix foundation.

- **Headless UI** — Limited component selection, not as active as Radix.

- **Material UI / Chakra UI** — Heavier, opinionated styling that conflicts
  with our Tailwind-first approach. Much harder to customize deeply.

- **Mantine** — Full-featured but brings its own styling system. Not
  Tailwind-native.
