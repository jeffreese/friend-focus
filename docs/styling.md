# Styling

We use [Tailwind CSS v4](https://tailwindcss.com/) with
[shadcn/ui](https://ui.shadcn.com/) components and a custom theme built on the
OKLCH color space. The theme is defined in `app/app.css` using CSS custom
properties and Tailwind's `@theme inline` directive.

## Theme System

The theme uses a two-layer pattern required by shadcn/ui:

1. **`:root` block** — Defines CSS custom properties with OKLCH values
2. **`@theme inline` block** — Maps those variables to Tailwind utilities

```css
:root {
  --primary: oklch(0.55 0.19 265);
  --primary-foreground: oklch(0.98 0.005 265);
  --background: oklch(0.99 0.002 265);
  --foreground: oklch(0.2 0.02 265);
  /* ... */
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

This gives you Tailwind utilities like `bg-primary`, `text-foreground`,
`border-border`, etc.

## OKLCH Colors

We use [OKLCH](https://oklch.com/) instead of hex or HSL because it's
perceptually uniform — a lightness of 0.6 looks equally bright regardless of
hue. This makes it much easier to create harmonious color palettes and ensure
accessible contrast ratios.

Each color token has three components:
- **Lightness** (0-1): How bright the color appears
- **Chroma** (0-0.4): How saturated/vivid the color is
- **Hue** (0-360): The color wheel position

## Semantic Tokens

The theme uses shadcn/ui's semantic naming conventions. This aligns our
components with the broader shadcn ecosystem:

### Core Tokens (shadcn standard)

| Token | Purpose |
|-------|---------|
| `background` | Page backgrounds |
| `foreground` | Primary text |
| `card` | Cards, elevated elements |
| `card-foreground` | Text on cards |
| `popover` | Popovers, dropdowns |
| `popover-foreground` | Text on popovers |
| `primary` | Main brand color, primary buttons |
| `primary-foreground` | Text on primary buttons |
| `secondary` | Secondary buttons |
| `secondary-foreground` | Text on secondary buttons |
| `accent` | Hover states, subtle backgrounds |
| `accent-foreground` | Text on accent backgrounds |
| `muted` | Muted/recessed backgrounds |
| `muted-foreground` | Secondary, less prominent text |
| `destructive` | Errors, destructive actions |
| `border` | Default borders |
| `input` | Input borders |
| `ring` | Focus rings |

### Custom Tokens (project-specific)

| Token | Purpose |
|-------|---------|
| `primary-light` | Lighter shade of primary |
| `primary-dark` | Darker shade of primary |
| `accent-teal` | Teal accent color |
| `accent-teal-light` | Light teal accent |
| `warning` | Warning states |
| `success` | Success states, confirmations |
| `destructive-light` | Light destructive background |
| `border-light` | Subtle borders |
| `foreground-light` | Tertiary text |

### Sidebar Tokens

The sidebar has its own set of tokens for independent theming:

| Token | Purpose |
|-------|---------|
| `sidebar` | Sidebar background |
| `sidebar-hover` | Sidebar item hover state |
| `sidebar-text` | Sidebar text |
| `sidebar-text-muted` | Sidebar secondary text |

## Customizing Colors

To rebrand the template, edit the `:root` block in `app/app.css`. A good
approach:

1. Pick your primary color at [oklch.com](https://oklch.com/)
2. Adjust the hue for accent, keeping similar lightness and chroma
3. Keep destructive/warning/success at conventional hues (red/yellow/green)
4. Adjust surface lightness values for your desired contrast

## Adding New Components

shadcn/ui components can be added via the CLI:

```bash
pnpm dlx shadcn@latest add <component-name>
```

This generates the component source code into `app/components/ui/`. You own
the code and can customize it. The `components.json` file configures the CLI
(aliases, style, CSS path).

## Utility Helper

Use the `cn()` function from `~/lib/utils` to merge Tailwind classes
conditionally:

```tsx
import { cn } from '~/lib/utils'

<div className={cn('rounded-lg p-4', isActive && 'bg-primary text-white')} />
```

This uses `clsx` + `tailwind-merge` under the hood to handle class conflicts
correctly.

## Why Tailwind v4 + shadcn/ui?

See [Decision 004 — Styling](./decisions/004-styling.md) for the Tailwind
reasoning and [Decision 010 — Component Library](./decisions/010-component-library.md)
for why we chose shadcn/ui.
