// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { NavigationProgress } from '~/components/ui/navigation-progress'
import { render } from './test-utils'

vi.mock('react-router', () => ({
  useNavigation: vi.fn(() => ({ state: 'idle' })),
}))

import { useNavigation } from 'react-router'

describe('NavigationProgress', () => {
  it('is hidden when idle', async () => {
    const { container } = await render(<NavigationProgress />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-hidden', 'true')
  })

  it('is visible when navigating', async () => {
    vi.mocked(useNavigation).mockReturnValue({
      state: 'loading',
    } as ReturnType<typeof useNavigation>)

    const { container } = await render(<NavigationProgress />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).toHaveAttribute('aria-hidden', 'false')
  })
})
