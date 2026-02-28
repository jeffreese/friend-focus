import { and, asc, desc, eq, ne } from 'drizzle-orm'
import { db } from '~/db/index.server'
import {
  availability,
  closenessTier,
  event,
  eventInvitation,
  friend,
  friendActivity,
  friendConnection,
} from '~/db/schema'
import { ACTIVITY_RATING_LABELS } from './schemas'

export type { FriendRecommendation } from './recommendation-scoring'

export {
  checkAvailability,
  scoreActivityInterest,
  scoreAttendance,
  scoreCloseness,
  scoreSocialFit,
  VIBE_WEIGHTS,
} from './recommendation-scoring'

import {
  buildExplanation,
  checkAvailability,
  type FriendRecommendation,
  scoreActivityInterest,
  scoreAttendance,
  scoreCloseness,
  scoreSocialFit,
  VIBE_WEIGHTS,
} from './recommendation-scoring'

export function getRecommendations(
  eventId: string,
  userId: string,
): FriendRecommendation[] {
  // Fetch event with its invitations
  const eventRow = db
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.userId, userId)))
    .get()
  if (!eventRow) return []

  const eventInvitations = db
    .select({
      id: eventInvitation.id,
      friendId: eventInvitation.friendId,
      status: eventInvitation.status,
    })
    .from(eventInvitation)
    .where(eq(eventInvitation.eventId, eventId))
    .all()

  // Fetch all friends with their tier, activity ratings, and availabilities
  const friends = db
    .select({
      id: friend.id,
      name: friend.name,
      closenessTierId: friend.closenessTierId,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
      tierSortOrder: closenessTier.sortOrder,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(eq(friend.userId, userId))
    .all()

  // Activity ratings for each friend
  const allRatings = db.select().from(friendActivity).all()
  const ratingsByFriend = new Map<
    string,
    Array<{ activityId: string; rating: number }>
  >()
  for (const r of allRatings) {
    if (!ratingsByFriend.has(r.friendId)) {
      ratingsByFriend.set(r.friendId, [])
    }
    ratingsByFriend.get(r.friendId)!.push(r)
  }

  // Availabilities for each friend
  const allAvail = db.select().from(availability).all()
  const availByFriend = new Map<
    string,
    Array<{ startDate: string; endDate: string; label: string }>
  >()
  for (const a of allAvail) {
    if (!availByFriend.has(a.friendId)) {
      availByFriend.set(a.friendId, [])
    }
    availByFriend.get(a.friendId)!.push(a)
  }

  // Connections
  const connections = db.select().from(friendConnection).all()
  const connectionMap = new Map<string, Map<string, number>>()
  for (const conn of connections) {
    if (!connectionMap.has(conn.friendAId)) {
      connectionMap.set(conn.friendAId, new Map())
    }
    if (!connectionMap.has(conn.friendBId)) {
      connectionMap.set(conn.friendBId, new Map())
    }
    connectionMap.get(conn.friendAId)!.set(conn.friendBId, conn.strength)
    connectionMap.get(conn.friendBId)!.set(conn.friendAId, conn.strength)
  }

  // All invitations for attendance scoring
  const allInvitations = db
    .select({
      friendId: eventInvitation.friendId,
      eventId: eventInvitation.eventId,
      status: eventInvitation.status,
      attended: eventInvitation.attended,
    })
    .from(eventInvitation)
    .all()
  const invitationsByFriend = new Map<
    string,
    Array<{ status: string; attended: boolean | null; eventId: string }>
  >()
  for (const inv of allInvitations) {
    if (!invitationsByFriend.has(inv.friendId)) {
      invitationsByFriend.set(inv.friendId, [])
    }
    invitationsByFriend.get(inv.friendId)!.push(inv)
  }

  // Recent events for recency boost
  const recentEvents = db
    .select({ id: event.id })
    .from(event)
    .where(and(eq(event.userId, userId), ne(event.id, eventId)))
    .orderBy(desc(event.createdAt))
    .limit(5)
    .all()
  const recentEventIds = recentEvents.map(e => e.id)

  // Current invitee set
  const inviteeMap = new Map<string, { id: string; status: string }>()
  for (const inv of eventInvitations) {
    inviteeMap.set(inv.friendId, { id: inv.id, status: inv.status })
  }
  const inviteeIds = new Set(inviteeMap.keys())

  // Tier range for closeness normalization
  const tiers = db
    .select({ sortOrder: closenessTier.sortOrder })
    .from(closenessTier)
    .where(eq(closenessTier.userId, userId))
    .orderBy(asc(closenessTier.sortOrder))
    .all()
  const minOrder = tiers.length > 0 ? tiers[0].sortOrder : 0
  const maxOrder = tiers.length > 0 ? tiers[tiers.length - 1].sortOrder : 0

  // Vibe weights
  const weights =
    VIBE_WEIGHTS[eventRow.vibe || 'balanced'] || VIBE_WEIGHTS.balanced

  // Score each friend
  const recommendations: FriendRecommendation[] = friends.map(f => {
    // Activity interest
    const friendRatings = ratingsByFriend.get(f.id) || []
    const activityRating = eventRow.activityId
      ? (friendRatings.find(r => r.activityId === eventRow.activityId)
          ?.rating ?? null)
      : null
    const interestScore = scoreActivityInterest(activityRating)
    const interestLabel = activityRating
      ? ACTIVITY_RATING_LABELS[activityRating] || 'Unknown'
      : 'No rating'

    // Closeness
    const closenessScore = scoreCloseness(
      f.tierSortOrder ?? null,
      minOrder,
      maxOrder,
    )

    // Social fit
    const otherInvitees = new Set(inviteeIds)
    otherInvitees.delete(f.id)
    const socialFit = scoreSocialFit(
      f.id,
      otherInvitees,
      connectionMap,
      eventRow.vibe,
    )

    // Attendance
    const friendInvs = invitationsByFriend.get(f.id) || []
    const attendanceResult = scoreAttendance(
      friendInvs,
      eventId,
      recentEventIds,
    )

    // Availability
    const friendAvail = availByFriend.get(f.id) || []
    const { available, note: availNote } = checkAvailability(
      friendAvail,
      eventRow.date,
    )

    // Composite score
    const compositeScore = Math.round(
      interestScore * weights.interest +
        closenessScore * weights.closeness +
        socialFit.score * weights.socialFit +
        attendanceResult.score * weights.attendance,
    )

    // Invitation status
    const invitation = inviteeMap.get(f.id)

    // Explanation
    const explanation = buildExplanation(
      interestLabel,
      interestScore,
      f.tierLabel ?? null,
      socialFit,
      attendanceResult.rate,
      available,
    )

    return {
      friendId: f.id,
      friendName: f.name,
      tierLabel: f.tierLabel ?? null,
      tierColor: f.tierColor ?? null,
      score: compositeScore,
      interest: { rating: interestLabel, score: interestScore },
      closeness: { tier: f.tierLabel ?? null, score: closenessScore },
      socialFit,
      attendance: attendanceResult,
      available,
      availabilityNote: availNote,
      explanation,
      isInvited: !!invitation,
      invitationId: invitation?.id ?? null,
      invitationStatus: invitation?.status ?? null,
    }
  })

  recommendations.sort((a, b) => b.score - a.score)

  return recommendations
}
