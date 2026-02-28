// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { FieldError } from '~/components/ui/field-error'
import { render, screen } from './test-utils'

describe('FieldError', () => {
  it('renders nothing when errors is undefined', async () => {
    const { container } = await render(<FieldError />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when errors is empty', async () => {
    const { container } = await render(<FieldError errors={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders only the first error', async () => {
    await render(<FieldError errors={['Too short', 'Must contain number']} />)
    expect(screen.getByText('Too short')).toBeInTheDocument()
    expect(screen.queryByText('Must contain number')).not.toBeInTheDocument()
  })

  it('has alert role for accessibility', async () => {
    await render(<FieldError errors={['Required']} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
