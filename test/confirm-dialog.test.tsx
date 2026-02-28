// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '~/components/ui/confirm-dialog'
import { render, screen, userEvent } from './test-utils'

describe('ConfirmDialog', () => {
  it('renders title and description when open', async () => {
    await render(
      <ConfirmDialog
        open={true}
        title="Delete item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('Delete item?')).toBeInTheDocument()
    expect(
      screen.getByText('This action cannot be undone.'),
    ).toBeInTheDocument()
  })

  it('does not render when closed', async () => {
    await render(
      <ConfirmDialog
        open={false}
        title="Delete item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.queryByText('Delete item?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    await render(
      <ConfirmDialog
        open={true}
        title="Delete?"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    await render(
      <ConfirmDialog
        open={true}
        title="Delete?"
        description="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('uses custom button text', async () => {
    await render(
      <ConfirmDialog
        open={true}
        title="Delete?"
        description="Are you sure?"
        confirmText="Yes, delete"
        cancelText="No, keep it"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /yes, delete/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /no, keep it/i }),
    ).toBeInTheDocument()
  })
})
