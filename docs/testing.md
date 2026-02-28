# Testing

We use [Vitest](https://vitest.dev/) as the test runner and
[Testing Library](https://testing-library.com/) for component tests.

## Running Tests

```bash
pnpm test          # Run all tests once
pnpm test:watch    # Run in watch mode during development
```

## Test Configuration

The Vitest config lives in `vitest.config.ts`, separate from the Vite config.
This is intentional — test configuration has different needs than the dev/build
config.

Tests run in a Node environment by default. Component tests that need a DOM use
the `jsdom` environment via an in-file directive.

## Writing Unit Tests

Unit tests don't need any special environment. Put them next to the code they
test or in the `test/` directory:

```ts
// test/utils.test.ts
import { describe, expect, it } from 'vitest'
import { cn } from '~/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
})
```

## Writing Component Tests

Component tests need the `jsdom` environment. Add the directive at the top of
the file:

```ts
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '../test-utils'
import { Button } from '~/components/ui/button'

describe('Button', () => {
  it('renders children', async () => {
    const { getByRole } = await render(<Button>Click me</Button>)
    expect(getByRole('button')).toHaveTextContent('Click me')
  })
})
```

### The `render` Helper

The test utilities in `test/test-utils.tsx` provide a wrapped `render` function
that handles React 19's async rendering. Always use this instead of importing
`render` directly from Testing Library:

```ts
import { render } from '../test-utils'
```

This wrapper uses `act()` internally to ensure all state updates are flushed
before assertions run.

## Test Organization

There's no strict convention, but we recommend:

- **Unit tests** (`test/*.test.ts`) for utilities and pure functions
- **Component tests** (`test/*.test.tsx`) for UI components
- Keep tests close to what they test or in the `test/` directory

## Accessibility Testing

The template includes `axe-core` for automated accessibility checks. You can
add axe assertions to component tests:

```ts
import { axe } from 'axe-core'

it('has no accessibility violations', async () => {
  const { container } = await render(<MyComponent />)
  const results = await axe(container)
  expect(results.violations).toHaveLength(0)
})
```

## Why Vitest?

See [Decision 008 — Testing](./decisions/008-testing.md) for why we chose
Vitest over Jest.
