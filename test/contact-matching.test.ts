import { describe, expect, it } from 'vitest'
import {
  areNicknameEquivalents,
  calculateMatchScore,
  calculateNameScore,
  findMatchesForFriend,
  fuzzyNameMatch,
  isPrefixMatch,
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

describe('areNicknameEquivalents', () => {
  it('recognizes Mike and Michael', () => {
    expect(areNicknameEquivalents('Mike', 'Michael')).toBe(true)
  })

  it('recognizes Bob and Robert', () => {
    expect(areNicknameEquivalents('Bob', 'Robert')).toBe(true)
  })

  it('recognizes Bill and William', () => {
    expect(areNicknameEquivalents('Bill', 'William')).toBe(true)
  })

  it('recognizes Liz and Elizabeth', () => {
    expect(areNicknameEquivalents('Liz', 'Elizabeth')).toBe(true)
  })

  it('returns false for names in different groups', () => {
    expect(areNicknameEquivalents('Mike', 'Bob')).toBe(false)
  })

  it('returns true for same name', () => {
    expect(areNicknameEquivalents('Mike', 'Mike')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(areNicknameEquivalents('mike', 'MICHAEL')).toBe(true)
  })

  it('returns false for names not in any group', () => {
    expect(areNicknameEquivalents('Zara', 'Zena')).toBe(false)
  })
})

describe('isPrefixMatch', () => {
  it('matches Dan and Daniel', () => {
    expect(isPrefixMatch('Dan', 'Daniel')).toBe(true)
  })

  it('matches Chris and Christopher', () => {
    expect(isPrefixMatch('Chris', 'Christopher')).toBe(true)
  })

  it('rejects Jo and John (too short)', () => {
    expect(isPrefixMatch('Jo', 'John')).toBe(false)
  })

  it('rejects Al and Alice (too short)', () => {
    expect(isPrefixMatch('Al', 'Alice')).toBe(false)
  })

  it('matches Dan and Danny', () => {
    expect(isPrefixMatch('Dan', 'Danny')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isPrefixMatch('dan', 'DANIEL')).toBe(true)
  })

  it('works in both directions', () => {
    expect(isPrefixMatch('Daniel', 'Dan')).toBe(true)
  })
})

describe('calculateNameScore', () => {
  it('returns 0.5 for exact full name match', () => {
    const result = calculateNameScore('John Doe', 'John Doe')
    expect(result.score).toBe(0.5)
    expect(result.reasons).toContain('Name matches exactly')
  })

  it('scores nickname + last name match (Mike Smith / Michael Smith)', () => {
    const result = calculateNameScore('Mike Smith', 'Michael Smith')
    expect(result.score).toBeGreaterThanOrEqual(0.4)
    expect(result.reasons).toContain('Last name matches')
    expect(result.reasons).toContain('Nickname match')
  })

  it('scores first-name-only contact as partial match (Sarah / Sarah Johnson)', () => {
    const result = calculateNameScore('Sarah', 'Sarah Johnson')
    expect(result.score).toBeGreaterThanOrEqual(0.2)
  })

  it('scores prefix + last name match (Dave Martinez / David Martinez)', () => {
    const result = calculateNameScore('Dave Martinez', 'David Martinez')
    // Dave→David is a nickname match (+0.2) + last name (+0.25) = 0.45
    expect(result.score).toBeGreaterThanOrEqual(0.4)
    expect(result.reasons).toContain('Last name matches')
  })

  it('scores prefix first name match (Chris Johnson / Christopher Johnson)', () => {
    const result = calculateNameScore('Chris Johnson', 'Christopher Johnson')
    expect(result.score).toBeGreaterThanOrEqual(0.4)
    expect(result.reasons).toContain('Last name matches')
  })

  it('scores Bob Smith vs Robert Smith via nickname', () => {
    const result = calculateNameScore('Bob Smith', 'Robert Smith')
    expect(result.score).toBeGreaterThanOrEqual(0.4)
    expect(result.reasons).toContain('Last name matches')
    expect(result.reasons).toContain('Nickname match')
  })

  it('returns 0 for completely different names', () => {
    const result = calculateNameScore('Alice Smith', 'Bob Johnson')
    expect(result.score).toBe(0)
    expect(result.reasons).toHaveLength(0)
  })

  it('returns 0 for empty names', () => {
    expect(calculateNameScore('', 'John').score).toBe(0)
    expect(calculateNameScore('John', '').score).toBe(0)
  })

  it('uses fuzzy fallback for names that are globally similar (>0.8)', () => {
    // "Jon Doe" vs "John Doe" — high Levenshtein similarity on the full string
    // Token-based: last name matches (+0.25), first name "jon" prefix of "john" (+0.15) = 0.4
    const result = calculateNameScore('Jon Doe', 'John Doe')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('handles single-token names', () => {
    const result = calculateNameScore('Dan', 'Daniel')
    expect(result.score).toBeGreaterThanOrEqual(0.15)
  })

  it('caps score at 0.5', () => {
    const result = calculateNameScore('John Doe', 'John Doe')
    expect(result.score).toBeLessThanOrEqual(0.5)
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

  it('returns confidence for similar names with matching last name', () => {
    const result = calculateMatchScore(
      { name: 'Jon Doe', email: null, phone: null },
      { name: 'John Doe', email: null, phone: null },
    )
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.reasons.length).toBeGreaterThan(0)
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

  it('matches nickname variants with email signal', () => {
    const result = calculateMatchScore(
      { name: 'Mike Smith', email: 'msmith@example.com', phone: null },
      { name: 'Michael Smith', email: 'msmith@example.com', phone: null },
    )
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    expect(result.reasons).toContain('Nickname match')
    expect(result.reasons).toContain('Email matches')
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
    // "Jonn Doe" vs "John Doe": last name +0.25, first name no match = 0.25
    // Below 0.5 threshold — correct behavior to avoid false positives
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
    // Name score (~0.4) + email match (0.5) = ~0.9 confidence
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(matches[0].index).toBe(0) // "John Doe" with matching email
  })

  it('matches nickname variants (Mike vs Michael)', () => {
    const nicknameContacts = [{ name: 'Mike Smith', email: null, phone: null }]
    const matches = findMatchesForFriend(nicknameContacts, {
      name: 'Michael Smith',
      email: null,
      phone: null,
    })
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.4)
  })

  it('matches prefix names (Dan vs Daniel)', () => {
    const prefixContacts = [{ name: 'Dan Brown', email: null, phone: null }]
    const matches = findMatchesForFriend(
      prefixContacts,
      { name: 'Daniel Brown', email: null, phone: null },
      0.3, // lower threshold for prefix-only matches
    )
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('matches first-name-only contacts to full names', () => {
    const firstNameContacts = [{ name: 'Sarah', email: null, phone: null }]
    const matches = findMatchesForFriend(
      firstNameContacts,
      { name: 'Sarah Johnson', email: null, phone: null },
      0.2, // low threshold for partial name matches
    )
    expect(matches.length).toBeGreaterThan(0)
  })

  it('accepts custom threshold parameter', () => {
    const matches = findMatchesForFriend(
      contacts,
      { name: 'Jonn Doe', email: null, phone: null },
      0.2, // very low threshold
    )
    // "Jonn Doe" vs "John Doe": ~0.25 score — matches with low threshold
    expect(matches.length).toBeGreaterThan(0)
  })
})
