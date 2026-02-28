// @vitest-environment jsdom
import { Inbox } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from '~/components/ui/empty-state'
import { render, screen } from './test-utils'

describe('EmptyState', () => {
  it('renders title', async () => {
    await render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders description', async () => {
    await render(
      <EmptyState
        title="No items"
        description="Try creating your first item."
      />,
    )
    expect(
      screen.getByText('Try creating your first item.'),
    ).toBeInTheDocument()
  })

  it('renders icon when provided', async () => {
    const { container } = await render(
      <EmptyState title="No items" icon={Inbox} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders action when provided', async () => {
    await render(
      <EmptyState
        title="No items"
        action={<button type="button">Create one</button>}
      />,
    )
    expect(
      screen.getByRole('button', { name: /create one/i }),
    ).toBeInTheDocument()
  })
})
