# 004 — Styling: Tailwind CSS v4 with OKLCH

Date: 2026-02-27

Status: Accepted

## Context

We need a styling approach that's productive, maintainable, and easy to
customize for different projects cloned from this template. The main contenders
were:

- **Tailwind CSS v4** — Utility-first CSS with a new CSS-native configuration
- **CSS Modules** — Scoped CSS with no runtime overhead
- **Styled Components / Emotion** — CSS-in-JS with runtime styles
- **Panda CSS** — Zero-runtime CSS-in-JS with a Tailwind-like API

## Decision

We chose Tailwind CSS v4 with OKLCH color tokens.

Tailwind v4 is a significant improvement over v3. Configuration moved from
`tailwind.config.js` to CSS via the `@theme` directive, which means the theme
is defined in the same language it generates. No JavaScript config file, no
`content` paths to configure, no plugin system to learn.

We use OKLCH colors because they're perceptually uniform — you can change the
hue of a color and its perceived brightness stays consistent. This makes it
trivial to create harmonious palettes and maintain accessible contrast ratios.
With HSL, two colors at the same lightness value can look completely different
in brightness. OKLCH fixes this.

The theme uses semantic tokens (`primary`, `surface`, `danger`) rather than
color names (`blue`, `gray`, `red`). When someone clones this template and
changes the primary color from blue to purple, they edit one line and everything
updates. No find-and-replace across the codebase.

## Consequences

**Good:**
- Very fast development with utility classes
- OKLCH makes palette creation and contrast checking intuitive
- Semantic tokens make rebranding a one-line change
- No runtime CSS overhead
- Tailwind v4's CSS-native config is simpler than v3's JavaScript config
- Vite plugin handles everything — no PostCSS config needed

**Neutral:**
- Utility classes in markup can be verbose (mitigated by component extraction)
- Requires learning Tailwind's class names (but they map closely to CSS
  properties)

**Trade-offs:**
- OKLCH has limited browser dev tools support for picking colors visually
- Tailwind v4 is newer with less community content than v3
- Team members need to know Tailwind (though it has a very shallow learning
  curve)
