import { describe, expect, it } from 'vitest'
import { cn, normalizeEmpty } from '~/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })
})

describe('normalizeEmpty', () => {
  it('converts empty strings to null', () => {
    const result = normalizeEmpty({ name: 'Alice', location: '' })
    expect(result.name).toBe('Alice')
    expect(result.location).toBeNull()
  })

  it('converts undefined to null', () => {
    const result = normalizeEmpty({ name: 'Alice', location: undefined })
    expect(result.name).toBe('Alice')
    expect(result.location).toBeNull()
  })

  it('preserves non-empty values', () => {
    const result = normalizeEmpty({
      name: 'Alice',
      count: 5,
      active: true,
      zero: 0,
      falsy: false,
    })
    expect(result.name).toBe('Alice')
    expect(result.count).toBe(5)
    expect(result.active).toBe(true)
    expect(result.zero).toBe(0)
    expect(result.falsy).toBe(false)
  })
})
