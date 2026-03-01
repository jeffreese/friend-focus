// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from './test-utils'

vi.mock('~/lib/auth.client', () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
    linkSocial: vi.fn(),
  },
}))

import { GoogleSignInButton } from '~/components/ui/google-button'

describe('GoogleSignInButton', () => {
  it('renders sign-in mode by default', async () => {
    await render(<GoogleSignInButton />)
    expect(screen.getByText('Continue with Google')).toBeDefined()
  })

  it('renders link mode text', async () => {
    await render(<GoogleSignInButton mode="link" />)
    expect(screen.getByText('Connect Google Account')).toBeDefined()
  })

  it('renders as a button element', async () => {
    await render(<GoogleSignInButton />)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
  })
})
