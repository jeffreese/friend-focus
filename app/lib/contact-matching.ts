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

interface NameScoreResult {
  score: number
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

// ─── Nickname dictionary ────────────────────────────────────────────────────

/**
 * Groups of equivalent names. The first element in each group is the
 * canonical form — every name in the group maps to it.
 */
const NICKNAME_GROUPS: string[][] = [
  ['michael', 'mike', 'mikey', 'mick'],
  ['robert', 'rob', 'bob', 'bobby', 'robbie'],
  ['william', 'will', 'bill', 'billy', 'willy', 'liam'],
  ['elizabeth', 'liz', 'lizzy', 'beth', 'betty', 'eliza'],
  ['james', 'jim', 'jimmy', 'jamie'],
  ['richard', 'rich', 'rick', 'dick', 'ricky'],
  ['joseph', 'joe', 'joey'],
  ['thomas', 'tom', 'tommy'],
  ['charles', 'charlie', 'chuck'],
  ['david', 'dave', 'davey'],
  ['daniel', 'dan', 'danny'],
  ['matthew', 'matt', 'matty'],
  ['christopher', 'chris', 'topher'],
  ['nicholas', 'nick', 'nicky'],
  ['alexander', 'alex', 'xander'],
  ['benjamin', 'ben', 'benny'],
  ['samuel', 'sam', 'sammy'],
  ['jonathan', 'jon', 'jonny'],
  ['john', 'johnny', 'jack'],
  ['anthony', 'tony'],
  ['edward', 'ed', 'eddie', 'ted', 'teddy'],
  ['stephen', 'steve', 'steven'],
  ['andrew', 'andy', 'drew'],
  ['timothy', 'tim', 'timmy'],
  ['jennifer', 'jen', 'jenny'],
  ['katherine', 'kate', 'kathy', 'katie', 'catherine', 'cathy', 'kat'],
  ['margaret', 'maggie', 'meg', 'peggy'],
  ['patricia', 'pat', 'patty', 'trish'],
  ['rebecca', 'becky', 'becca'],
  ['sarah', 'sara'],
  ['jessica', 'jess', 'jessie'],
  ['victoria', 'vicky', 'tori'],
  ['stephanie', 'steph'],
  ['christina', 'tina'],
  ['alexandra', 'lexi', 'alexa'],
  ['theodore', 'theo'],
  ['zachary', 'zach', 'zack'],
  ['nathaniel', 'nate', 'nathan'],
  ['phillip', 'phil'],
  ['gregory', 'greg'],
  ['lawrence', 'larry'],
  ['raymond', 'ray'],
  ['gerald', 'gerry', 'jerry'],
  ['douglas', 'doug'],
  ['eugene', 'gene'],
  ['leonard', 'leo', 'lenny'],
  ['frederick', 'fred', 'freddy'],
  ['peter', 'pete'],
]

const NICKNAME_TO_CANONICAL = new Map<string, string>()
for (const group of NICKNAME_GROUPS) {
  const canonical = group[0]
  for (const name of group) {
    NICKNAME_TO_CANONICAL.set(name, canonical)
  }
}

/**
 * Check if two first names are nickname equivalents
 * (e.g. "Mike" and "Michael", "Bob" and "Robert").
 */
export function areNicknameEquivalents(a: string, b: string): boolean {
  const normA = a.trim().toLowerCase()
  const normB = b.trim().toLowerCase()
  if (normA === normB) return true
  const canonA = NICKNAME_TO_CANONICAL.get(normA)
  const canonB = NICKNAME_TO_CANONICAL.get(normB)
  if (!canonA || !canonB) return false
  return canonA === canonB
}

// ─── Prefix matching ────────────────────────────────────────────────────────

/**
 * Check if one name is a prefix of the other (e.g. "Dan" → "Daniel").
 * Requires both names to be at least `minLength` characters.
 */
export function isPrefixMatch(a: string, b: string, minLength = 3): boolean {
  const normA = a.trim().toLowerCase()
  const normB = b.trim().toLowerCase()
  if (normA.length < minLength || normB.length < minLength) return false
  return normA.startsWith(normB) || normB.startsWith(normA)
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

// ─── Token-based name scoring ───────────────────────────────────────────────

/**
 * Score how similar two names are using token-based comparison with
 * nickname detection, prefix matching, and fuzzy fallback.
 *
 * Scoring:
 * - Exact full name:           0.5
 * - Last name exact match:    +0.25
 * - First name exact:         +0.25
 * - First name nickname:      +0.25
 * - First name prefix (3+):   +0.15
 * - First name fuzzy (>0.8):  +0.15
 * - Token subset:             +0.2
 * - Fallback full fuzzy >0.8:  floor 0.3
 *
 * Capped at 0.5.
 */
export function calculateNameScore(
  contactName: string,
  friendName: string,
): NameScoreResult {
  const normA = contactName.trim().toLowerCase()
  const normB = friendName.trim().toLowerCase()

  // Exact full name match
  if (normA === normB) {
    return { score: 0.5, reasons: ['Name matches exactly'] }
  }

  if (!normA || !normB) {
    return { score: 0, reasons: [] }
  }

  const tokensA = normA.split(/\s+/)
  const tokensB = normB.split(/\s+/)

  let score = 0
  const reasons: string[] = []

  const firstA = tokensA[0]
  const firstB = tokensB[0]
  const lastA = tokensA.length > 1 ? tokensA[tokensA.length - 1] : null
  const lastB = tokensB.length > 1 ? tokensB[tokensB.length - 1] : null

  // Last name comparison (only when both have multi-token names)
  if (lastA && lastB && lastA === lastB) {
    score += 0.25
    reasons.push('Last name matches')
  }

  // First name comparison (cascade: exact > nickname > prefix > fuzzy)
  if (firstA === firstB) {
    score += 0.25
    reasons.push('First name matches')
  } else if (areNicknameEquivalents(firstA, firstB)) {
    score += 0.25
    reasons.push('Nickname match')
  } else if (isPrefixMatch(firstA, firstB)) {
    score += 0.15
    reasons.push('First name similar')
  } else if (fuzzyNameMatch(firstA, firstB) > 0.8) {
    score += 0.15
    reasons.push('First name similar')
  }

  // Token subset check (e.g. "Sarah" vs "Sarah Johnson")
  // Only applies when one name has fewer tokens than the other
  if (tokensA.length !== tokensB.length) {
    const smaller = tokensA.length < tokensB.length ? tokensA : tokensB
    const larger = tokensA.length < tokensB.length ? tokensB : tokensA
    const allFound = smaller.every(t => larger.includes(t))
    if (allFound && score < 0.2) {
      score = 0.2
      reasons.push('Name is a partial match')
    }
  }

  // Backward compatibility: if full-name fuzzy was > 0.8 and our
  // token-based score is below 0.3, use the old score as a floor
  const fullFuzzy = fuzzyNameMatch(contactName, friendName)
  if (fullFuzzy > 0.8 && score < 0.3) {
    score = 0.3
    if (reasons.length === 0) {
      reasons.push('Name is similar')
    }
  }

  return {
    score: Math.min(score, 0.5),
    reasons,
  }
}

// ─── Matching algorithm ─────────────────────────────────────────────────────

/**
 * Score how likely two candidates refer to the same person.
 *
 * Scoring:
 * - Exact email match:     +0.5
 * - Exact phone match:     +0.4
 * - Name (token-based):    up to +0.5
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

  // Name comparison (token-based with nickname + prefix support)
  const nameResult = calculateNameScore(contact.name, friend.name)
  confidence += nameResult.score
  reasons.push(...nameResult.reasons)

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
  threshold = 0.5,
): Array<{ index: number; confidence: number; reasons: string[] }> {
  const matches: Array<{
    index: number
    confidence: number
    reasons: string[]
  }> = []

  for (let i = 0; i < contacts.length; i++) {
    const result = calculateMatchScore(contacts[i], friend)
    if (result.confidence >= threshold) {
      matches.push({
        index: i,
        confidence: result.confidence,
        reasons: result.reasons,
      })
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence)
}
