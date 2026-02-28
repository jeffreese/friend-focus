// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { SubmitButton } from '~/components/ui/submit-button'
import { render, screen } from './test-utils'

// Mock useNavigation from react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigation: vi.fn(() => ({ state: 'idle' })),
  }
})

import { useNavigation } from 'react-router'

describe('SubmitButton', () => {
  it('renders children when idle', async () => {
    await render(<SubmitButton>Save</SubmitButton>)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('shows loading state when submitting', async () => {
    vi.mocked(useNavigation).mockReturnValue({
      state: 'submitting',
    } as ReturnType<typeof useNavigation>)

    await render(<SubmitButton>Save</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows pending text when submitting', async () => {
    vi.mocked(useNavigation).mockReturnValue({
      state: 'submitting',
    } as ReturnType<typeof useNavigation>)

    await render(<SubmitButton pendingText="Saving...">Save</SubmitButton>)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })
})
