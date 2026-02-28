import { describe, expect, it } from 'vitest'
import { formatBirthday, formatDate, formatRelativeDate } from '~/lib/format'

describe('formatBirthday', () => {
  it('shows month and day when year is 1900 (unknown)', () => {
    expect(formatBirthday('1900-11-30')).toBe('November 30')
  })

  it('shows full date when year is known', () => {
    expect(formatBirthday('1995-11-30')).toBe('November 30, 1995')
  })

  it('returns the original string for invalid input', () => {
    expect(formatBirthday('not-a-date')).toBe('not-a-date')
  })

  it('returns the original string for empty input', () => {
    expect(formatBirthday('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a date string as short month, day, year', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026')
  })

  it('handles December correctly', () => {
    expect(formatDate('2025-12-25')).toBe('Dec 25, 2025')
  })

  it('returns the original string for invalid input', () => {
    expect(formatDate('invalid')).toBe('invalid')
  })
})

describe('formatRelativeDate', () => {
  it('returns "just now" for very recent dates', () => {
    expect(formatRelativeDate(new Date())).toBe('just now')
  })

  it('returns minutes ago for dates less than an hour old', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeDate(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago for dates less than a day old', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000)
    expect(formatRelativeDate(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for dates less than a week old', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000)
    expect(formatRelativeDate(twoDaysAgo)).toBe('2d ago')
  })

  it('returns weeks ago for dates less than a month old', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000)
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2w ago')
  })

  it('accepts string dates', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeDate(fiveMinAgo)).toBe('5m ago')
  })
})
