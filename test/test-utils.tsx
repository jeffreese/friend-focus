import {
  cleanup,
  type RenderOptions,
  render as rtlRender,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { act } from 'react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Wrap render with act() for React 19 compatibility
export async function render(ui: ReactElement, options?: RenderOptions) {
  let result: ReturnType<typeof rtlRender>
  await act(async () => {
    result = rtlRender(ui, options)
  })
  return result!
}

export { screen, waitFor } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
