# 006 — State Management: Zustand

Date: 2026-02-27

Status: Accepted

## Context

We need a solution for client-side UI state that's not managed by the server.
React Router handles server state through loaders and actions, but some state is
purely client-side — sidebar collapsed, modal open, theme preference, etc. The
main contenders were:

- **Zustand** — Minimal state management with hooks
- **Jotai** — Atomic state management
- **Redux Toolkit** — The established standard
- **React Context** + `useState` — Built-in React primitives

## Decision

We chose Zustand.

Zustand is the simplest external state library that still provides meaningful
value over plain React state. A store is a single `create()` call that returns
a hook. No providers, no reducers, no actions, no dispatch. It's small enough
that you can read the entire source code in a few minutes.

Compared to Redux Toolkit, Zustand is dramatically simpler. Redux's
slice/reducer/action/dispatch pattern solves problems we don't have — our server
state is already handled by React Router. We only need client UI state, and
Zustand handles that with minimal ceremony.

Compared to Jotai, Zustand is more straightforward for our use case. Jotai's
atomic model shines when you have lots of interdependent state, but for simple
UI flags, a Zustand store is clearer.

Compared to React Context, Zustand avoids re-rendering entire subtrees when
state changes. With Context, every consumer re-renders when any value changes.
Zustand's selector pattern means components only re-render when their specific
slice of state changes.

## Consequences

**Good:**
- Minimal boilerplate — a store is ~10 lines of code
- No providers needed (works outside the React tree too)
- Selector-based subscriptions prevent unnecessary re-renders
- Built-in middleware for persistence, devtools, immer
- Tiny bundle size (~1KB)

**Neutral:**
- No built-in devtools (Redux DevTools middleware available if needed)
- Less structure than Redux (could be good or bad depending on team preferences)

**Trade-offs:**
- For very large applications, the lack of structure might become a problem
  (but by then you'd likely outgrow a template anyway)
- No built-in async support (but we don't need it — async data goes through
  React Router loaders)
