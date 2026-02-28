// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Button } from '~/components/ui/button'
import { render, screen } from './test-utils'

describe('Button', () => {
  it('renders with text', async () => {
    await render(<Button>Click me</Button>)
    expect(
      screen.getByRole('button', { name: /click me/i }),
    ).toBeInTheDocument()
  })

  it('applies default variant (primary styling)', async () => {
    await render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-primary')
  })

  it('applies destructive variant', async () => {
    await render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-destructive')
  })

  it('applies outline variant', async () => {
    await render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border')
  })

  it('can be disabled', async () => {
    await render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
