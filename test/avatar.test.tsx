// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Avatar, getInitials } from '~/components/ui/avatar'
import { render, screen } from './test-utils'

describe('getInitials', () => {
  it('returns first letter of each word, max 2', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Alice Bob Carol')).toBe('AB')
    expect(getInitials('Cher')).toBe('C')
  })

  it('uppercases the result', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('Avatar', () => {
  it('renders initials when no src is provided', async () => {
    await render(<Avatar name="Jane Smith" />)
    const avatar = screen.getByRole('img', { name: 'Jane Smith' })
    expect(avatar.textContent).toBe('JS')
  })

  it('renders an image when src is provided', async () => {
    await render(<Avatar name="Jane Smith" src="/photos/jane.jpg" />)
    const img = screen.getByAltText('Jane Smith')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/photos/jane.jpg')
  })

  it('falls back to initials when image fails to load', async () => {
    await render(<Avatar name="Jane Smith" src="/photos/broken.jpg" />)
    const img = screen.getByAltText('Jane Smith')

    // Simulate image error
    const { fireEvent } = await import('@testing-library/react')
    const { act } = await import('react')
    await act(() => {
      fireEvent.error(img)
    })

    // After error, initials should be shown instead of img
    const avatar = screen.getByRole('img', { name: 'Jane Smith' })
    expect(avatar.textContent).toBe('JS')
    expect(avatar.querySelector('img')).toBeNull()
  })

  it('renders without src (undefined)', async () => {
    await render(<Avatar name="Bob" src={undefined} />)
    const avatar = screen.getByRole('img', { name: 'Bob' })
    expect(avatar.textContent).toBe('B')
    expect(avatar.querySelector('img')).toBeNull()
  })

  it('renders without src (null)', async () => {
    await render(<Avatar name="Bob" src={null} />)
    const avatar = screen.getByRole('img', { name: 'Bob' })
    expect(avatar.textContent).toBe('B')
    expect(avatar.querySelector('img')).toBeNull()
  })

  it('applies custom color as background when no image', async () => {
    await render(<Avatar name="Bob" color="#ff0000" />)
    const avatar = screen.getByRole('img', { name: 'Bob' })
    expect(avatar.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })
})
