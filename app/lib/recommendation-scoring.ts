import { ACTIVITY_RATING_LABELS } from './schemas'

export interface FriendRecommendation {
  friendId: string
  friendName: string
  tierLabel: string | null
  tierColor: string | null
  score: number
  interest: { rating: string; score: number }
  closeness: { tier: string | null; score: number }
  socialFit: { knows: number; of: number; score: number }
  attendance: { rate: string; score: number }
  available: boolean
  availabilityNote: string | null
  explanation: string
  isInvited: boolean
  invitationId: string | null
  invitationStatus: string | null
}

export const VIBE_WEIGHTS: Record<
  string,
  {
    interest: number
    closeness: number
    socialFit: number
    attendance: number
  }
> = {
  tight_knit: {
    interest: 0.2,
    closeness: 0.3,
    socialFit: 0.35,
    attendance: 0.15,
  },
  mixer: {
    interest: 0.15,
    closeness: 0.2,
    socialFit: 0.4,
    attendance: 0.25,
  },
  activity_focused: {
    interest: 0.45,
    closeness: 0.15,
    socialFit: 0.15,
    attendance: 0.25,
  },
  balanced: {
    interest: 0.25,
    closeness: 0.25,
    socialFit: 0.25,
    attendance: 0.25,
  },
}

const RATING_SCORES: Record<number, number> = {
  1: 100,
  2: 75,
  3: 50,
  4: 25,
  5: 0,
}

export function scoreActivityInterest(rating: number | null): number {
  if (rating === null) return 40
  return RATING_SCORES[rating] ?? 40
}

export function scoreCloseness(
  sortOrder: number | null,
  minOrder: number,
  maxOrder: number,
): number {
  if (sortOrder === null) return 30
  if (minOrder === maxOrder) return 100
  return Math.round(
    100 - ((sortOrder - minOrder) / (maxOrder - minOrder)) * 100,
  )
}

export function scoreSocialFit(
  friendId: string,
  inviteeIds: Set<string>,
  connectionMap: Map<string, Map<string, number>>,
  vibe: string | null,
): { knows: number; of: number; score: number } {
  const inviteeCount = inviteeIds.size
  if (inviteeCount === 0) return { knows: 0, of: 0, score: 50 }

  const friendConns = connectionMap.get(friendId)
  let connectedCount = 0
  let strengthSum = 0

  if (friendConns) {
    for (const inviteeId of inviteeIds) {
      const strength = friendConns.get(inviteeId)
      if (strength !== undefined) {
        connectedCount++
        strengthSum += strength
      }
    }
  }

  let score: number
  if (vibe === 'tight_knit') {
    score = Math.round((strengthSum / (5 * inviteeCount)) * 100)
  } else if (vibe === 'mixer') {
    const notConnected = inviteeCount - connectedCount
    score = Math.round((notConnected / inviteeCount) * 100)
  } else {
    const tightKnit = Math.round((strengthSum / (5 * inviteeCount)) * 100)
    const mixer = Math.round(
      ((inviteeCount - connectedCount) / inviteeCount) * 100,
    )
    score = Math.round((tightKnit + mixer) / 2)
  }

  return { knows: connectedCount, of: inviteeCount, score }
}

export function scoreAttendance(
  friendInvitations: Array<{
    status: string
    attended: boolean | null
    eventId: string
  }>,
  currentEventId: string,
  recentEventIds: string[],
): { rate: string; score: number } {
  const past = friendInvitations.filter(i => i.eventId !== currentEventId)

  if (past.length === 0) return { rate: '0/0', score: 50 }

  let positiveCount = 0
  let resolvedCount = 0

  for (const inv of past) {
    if (inv.attended === true) {
      positiveCount++
      resolvedCount++
    } else if (inv.attended === false) {
      resolvedCount++
    } else if (inv.status === 'attending') {
      positiveCount++
      resolvedCount++
    } else if (inv.status === 'declined') {
      resolvedCount++
    }
  }

  let score =
    resolvedCount > 0 ? Math.round((positiveCount / resolvedCount) * 100) : 50

  // Recency boost: if not invited in recent events, boost score
  const recentInvitedEventIds = new Set(past.map(i => i.eventId))
  const recentMissed = recentEventIds
    .slice(0, 3)
    .filter(eid => !recentInvitedEventIds.has(eid)).length
  if (recentMissed >= 3) score = Math.min(100, score + 10)
  else if (recentMissed >= 2) score = Math.min(100, score + 5)

  return { rate: `${positiveCount}/${past.length}`, score }
}

export function checkAvailability(
  availabilities: Array<{
    startDate: string
    endDate: string
    label: string
  }>,
  eventDate: string | null,
): { available: boolean; note: string | null } {
  if (!eventDate) return { available: true, note: null }

  for (const a of availabilities) {
    if (eventDate >= a.startDate && eventDate <= a.endDate) {
      return {
        available: false,
        note: `${a.label}: ${a.startDate} - ${a.endDate}`,
      }
    }
  }

  return { available: true, note: null }
}

export function buildExplanation(
  interestRating: string,
  interestScore: number,
  closenessLabel: string | null,
  socialFit: { knows: number; of: number },
  attendanceRate: string,
  available: boolean,
): string {
  const parts: string[] = []

  if (interestScore >= 75) parts.push(`Interest: ${interestRating}`)
  else if (interestScore <= 25) parts.push(`Low interest: ${interestRating}`)

  if (closenessLabel) parts.push(`Tier: ${closenessLabel}`)
  if (socialFit.of > 0)
    parts.push(`Knows ${socialFit.knows}/${socialFit.of} invitees`)
  if (attendanceRate !== '0/0') parts.push(`Attendance: ${attendanceRate}`)
  if (!available) parts.push('Unavailable')

  return parts.join(' · ')
}

export function getRatingLabel(rating: number | null): string {
  if (rating === null) return 'No rating'
  return ACTIVITY_RATING_LABELS[rating] || `Rating ${rating}`
}
