import { describe, expect, it } from 'vitest'
import {
  calculateMatchScore,
  findMatchesForFriend,
  fuzzyNameMatch,
  normalizePhone,
} from '~/lib/contact-matching'

describe('normalizePhone', () => {
  it('strips dashes and spaces', () => {
    expect(normalizePhone('555-123-4567')).toBe('5551234567')
    expect(normalizePhone('555 123 4567')).toBe('5551234567')
  })

  it('strips parentheses', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567')
  })

  it('strips dots', () => {
    expect(normalizePhone('555.123.4567')).toBe('5551234567')
  })

  it('strips leading US country code (1)', () => {
    expect(normalizePhone('+1 555-123-4567')).toBe('5551234567')
    expect(normalizePhone('1-555-123-4567')).toBe('5551234567')
  })

  it('does not strip non-US country codes', () => {
    expect(normalizePhone('+44 20 7946 0958')).toBe('442079460958')
  })

  it('handles already-clean numbers', () => {
    expect(normalizePhone('5551234567')).toBe('5551234567')
  })

  it('handles empty string', () => {
    expect(normalizePhone('')).toBe('')
  })
})

describe('fuzzyNameMatch', () => {
  it('returns 1 for exact match', () => {
    expect(fuzzyNameMatch('John Doe', 'John Doe')).toBe(1)
  })

  it('returns 1 for case-insensitive exact match', () => {
    expect(fuzzyNameMatch('john doe', 'John Doe')).toBe(1)
  })

  it('returns high score for close names', () => {
    const score = fuzzyNameMatch('John Doe', 'Jon Doe')
    expect(score).toBeGreaterThan(0.8)
  })

  it('returns low score for very different names', () => {
    const score = fuzzyNameMatch('John Doe', 'Alice Smith')
    expect(score).toBeLessThan(0.5)
  })

  it('returns 0 for empty strings', () => {
    expect(fuzzyNameMatch('', 'John')).toBe(0)
    expect(fuzzyNameMatch('John', '')).toBe(0)
  })

  it('handles whitespace trimming', () => {
    expect(fuzzyNameMatch('  John Doe  ', 'John Doe')).toBe(1)
  })
})

describe('calculateMatchScore', () => {
  it('returns high confidence for exact name + email match', () => {
    const result = calculateMatchScore(
      { name: 'John Doe', email: 'john@example.com', phone: null },
      { name: 'John Doe', email: 'john@example.com', phone: null },
    )
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    expect(result.reasons).toContain('Name matches exactly')
    expect(result.reasons).toContain('Email matches')
  })

  it('returns high confidence for name + phone match', () => {
    const result = calculateMatchScore(
      { name: 'John Doe', email: null, phone: '555-123-4567' },
      { name: 'John Doe', email: null, phone: '(555) 123-4567' },
    )
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    expect(result.reasons).toContain('Phone matches')
  })

  it('returns moderate confidence for email match only', () => {
    const result = calculateMatchScore(
      { name: 'Johnny D', email: 'john@example.com', phone: null },
      { name: 'John Doe', email: 'john@example.com', phone: null },
    )
    expect(result.confidence).toBeGreaterThanOrEqual(0.5)
    expect(result.reasons).toContain('Email matches')
  })

  it('returns confidence for fuzzy name match', () => {
    const result = calculateMatchScore(
      { name: 'Jon Doe', email: null, phone: null },
      { name: 'John Doe', email: null, phone: null },
    )
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.reasons).toContain('Name is similar')
  })

  it('returns 0 for completely different contacts', () => {
    const result = calculateMatchScore(
      {
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: '111-111-1111',
      },
      { name: 'Bob Johnson', email: 'bob@test.com', phone: '999-999-9999' },
    )
    expect(result.confidence).toBe(0)
    expect(result.reasons).toHaveLength(0)
  })

  it('caps confidence at 1.0', () => {
    const result = calculateMatchScore(
      { name: 'John Doe', email: 'john@example.com', phone: '555-123-4567' },
      { name: 'John Doe', email: 'john@example.com', phone: '555-123-4567' },
    )
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('handles null/undefined fields gracefully', () => {
    const result = calculateMatchScore(
      { name: 'John', email: null, phone: null },
      { name: 'John', email: null, phone: null },
    )
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.reasons).toContain('Name matches exactly')
  })

  it('email comparison is case-insensitive', () => {
    const result = calculateMatchScore(
      { name: 'Test', email: 'John@Example.COM', phone: null },
      { name: 'Test', email: 'john@example.com', phone: null },
    )
    expect(result.reasons).toContain('Email matches')
  })

  it('phone comparison normalizes formats', () => {
    const result = calculateMatchScore(
      { name: 'Test', email: null, phone: '+1 (555) 123-4567' },
      { name: 'Test', email: null, phone: '555.123.4567' },
    )
    expect(result.reasons).toContain('Phone matches')
  })
})

describe('findMatchesForFriend', () => {
  const contacts = [
    { name: 'John Doe', email: 'john@example.com', phone: '555-1234' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678' },
    { name: 'Bob Johnson', email: 'bob@test.com', phone: '555-9999' },
    { name: 'Jon Doe', email: 'jondoe@gmail.com', phone: null },
  ]

  it('finds exact match at top', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    })
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].index).toBe(0) // First contact
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('returns empty for no matches', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'Nobody Here',
      email: 'nobody@nowhere.com',
      phone: '000-0000',
    })
    expect(matches).toHaveLength(0)
  })

  it('sorts by confidence descending', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'John Doe',
      email: null,
      phone: null,
    })
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].confidence).toBeLessThanOrEqual(
        matches[i - 1].confidence,
      )
    }
  })

  it('does not suggest on fuzzy name alone without strong additional signal', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'Jonn Doe',
      email: null,
      phone: null,
    })
    // Fuzzy name-only match scores below 0.5 threshold — correct behavior
    // to avoid false positives
    expect(matches).toHaveLength(0)
  })

  it('suggests on exact name match even without email or phone', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'Jon Doe',
      email: null,
      phone: null,
    })
    // Exact name match scores 0.5 — meets threshold
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(matches[0].reasons).toContain('Name matches exactly')
  })

  it('includes fuzzy name match when email also matches', () => {
    const matches = findMatchesForFriend(contacts, {
      name: 'Jon Doe',
      email: 'john@example.com',
      phone: null,
    })
    // Fuzzy name (0.3) + email match (0.5) = 0.8 confidence
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(matches[0].index).toBe(0) // "John Doe" with matching email
  })
})
