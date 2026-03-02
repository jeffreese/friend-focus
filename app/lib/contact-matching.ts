// ─── Types ──────────────────────────────────────────────────────────────────

export interface MatchCandidate {
  name: string
  email?: string | null
  phone?: string | null
}

export interface MatchResult {
  confidence: number // 0–1
  reasons: string[]
}

// ─── Phone normalization ────────────────────────────────────────────────────

/**
 * Strip a phone number to digits only for comparison.
 * Handles country codes, dashes, parens, spaces, dots.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Strip leading "1" (US country code) if 11 digits
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

// ─── Fuzzy name matching ────────────────────────────────────────────────────

/**
 * Compute Levenshtein edit distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length

  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  )

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }

  return dp[m][n]
}

/**
 * Return a 0–1 similarity score between two names.
 * 1 = identical, 0 = completely different.
 */
export function fuzzyNameMatch(a: string, b: string): number {
  const normA = a.trim().toLowerCase()
  const normB = b.trim().toLowerCase()

  if (normA === normB) return 1
  if (!normA || !normB) return 0

  const maxLen = Math.max(normA.length, normB.length)
  const distance = levenshtein(normA, normB)

  return 1 - distance / maxLen
}

// ─── Matching algorithm ─────────────────────────────────────────────────────

const THRESHOLD = 0.5

/**
 * Score how likely two candidates refer to the same person.
 *
 * Scoring:
 * - Exact email match:     +0.5
 * - Exact phone match:     +0.4
 * - Exact name match:      +0.5
 * - Fuzzy name (>0.8):     +0.3
 *
 * Confidence capped at 1.0.
 */
export function calculateMatchScore(
  contact: MatchCandidate,
  friend: MatchCandidate,
): MatchResult {
  let confidence = 0
  const reasons: string[] = []

  // Email comparison
  if (contact.email && friend.email) {
    if (
      contact.email.trim().toLowerCase() === friend.email.trim().toLowerCase()
    ) {
      confidence += 0.5
      reasons.push('Email matches')
    }
  }

  // Phone comparison (normalized)
  if (contact.phone && friend.phone) {
    const normContact = normalizePhone(contact.phone)
    const normFriend = normalizePhone(friend.phone)
    if (normContact && normFriend && normContact === normFriend) {
      confidence += 0.4
      reasons.push('Phone matches')
    }
  }

  // Name comparison
  const nameScore = fuzzyNameMatch(contact.name, friend.name)
  if (nameScore === 1) {
    confidence += 0.5
    reasons.push('Name matches exactly')
  } else if (nameScore > 0.8) {
    confidence += 0.3
    reasons.push('Name is similar')
  }

  return {
    confidence: Math.min(confidence, 1),
    reasons,
  }
}

/**
 * Find matches for a friend from a list of cached contacts.
 * Returns contacts above the confidence threshold, sorted by score.
 */
export function findMatchesForFriend(
  contacts: MatchCandidate[],
  friend: MatchCandidate,
): Array<{ index: number; confidence: number; reasons: string[] }> {
  const matches: Array<{
    index: number
    confidence: number
    reasons: string[]
  }> = []

  for (let i = 0; i < contacts.length; i++) {
    const result = calculateMatchScore(contacts[i], friend)
    if (result.confidence >= THRESHOLD) {
      matches.push({
        index: i,
        confidence: result.confidence,
        reasons: result.reasons,
      })
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence)
}
