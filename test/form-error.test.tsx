// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { FormError } from '~/components/ui/form-error'
import { render, screen } from './test-utils'

describe('FormError', () => {
  it('renders nothing when errors is undefined', async () => {
    const { container } = await render(<FormError />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when errors is empty', async () => {
    const { container } = await render(<FormError errors={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders error messages', async () => {
    await render(<FormError errors={['Invalid email', 'Password required']} />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(screen.getByText('Password required')).toBeInTheDocument()
  })

  it('has alert role for accessibility', async () => {
    await render(<FormError errors={['Something went wrong']} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
