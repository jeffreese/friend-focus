import { and, asc, count, desc, eq, like } from 'drizzle-orm'
import { db } from '~/db/index.server'
import {
  activity,
  availability,
  closenessTier,
  event,
  eventInvitation,
  friend,
  friendActivity,
  friendConnection,
  giftIdea,
  note,
} from '~/db/schema'
import type { FriendInput } from './schemas'

export function getFriends({
  userId,
  search,
  tierId,
  sortBy = 'name',
}: {
  userId: string
  search?: string
  tierId?: string
  sortBy?: 'name' | 'closeness' | 'createdAt'
}) {
  let query = db
    .select({
      id: friend.id,
      name: friend.name,
      photo: friend.photo,
      phone: friend.phone,
      email: friend.email,
      birthday: friend.birthday,
      location: friend.location,
      careModeActive: friend.careModeActive,
      careModeNote: friend.careModeNote,
      closenessTierId: friend.closenessTierId,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
      tierSortOrder: closenessTier.sortOrder,
      userId: friend.userId,
      createdAt: friend.createdAt,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(eq(friend.userId, userId))
    .$dynamic()

  if (search) {
    query = query.where(
      and(eq(friend.userId, userId), like(friend.name, `%${search}%`)),
    )
  }

  if (tierId) {
    query = query.where(
      and(eq(friend.userId, userId), eq(friend.closenessTierId, tierId)),
    )
  }

  if (search && tierId) {
    query = query.where(
      and(
        eq(friend.userId, userId),
        like(friend.name, `%${search}%`),
        eq(friend.closenessTierId, tierId),
      ),
    )
  }

  if (sortBy === 'closeness') {
    return query.orderBy(asc(closenessTier.sortOrder), asc(friend.name)).all()
  }
  if (sortBy === 'createdAt') {
    return query.orderBy(desc(friend.createdAt)).all()
  }
  return query.orderBy(asc(friend.name)).all()
}

export function getFriend(id: string, userId: string) {
  return db
    .select()
    .from(friend)
    .where(and(eq(friend.id, id), eq(friend.userId, userId)))
    .get()
}

export function getFriendWithTier(id: string, userId: string) {
  return db
    .select({
      id: friend.id,
      name: friend.name,
      photo: friend.photo,
      phone: friend.phone,
      email: friend.email,
      socialHandles: friend.socialHandles,
      birthday: friend.birthday,
      location: friend.location,
      loveLanguage: friend.loveLanguage,
      favoriteFood: friend.favoriteFood,
      dietaryRestrictions: friend.dietaryRestrictions,
      employer: friend.employer,
      occupation: friend.occupation,
      personalNotes: friend.personalNotes,
      careModeActive: friend.careModeActive,
      careModeNote: friend.careModeNote,
      careModeReminder: friend.careModeReminder,
      careModeStartedAt: friend.careModeStartedAt,
      closenessTierId: friend.closenessTierId,
      userId: friend.userId,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
      tierSortOrder: closenessTier.sortOrder,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(and(eq(friend.id, id), eq(friend.userId, userId)))
    .get()
}

/** Get the full friend detail with all related data */
export function getFriendDetail(id: string, userId: string) {
  const f = getFriendWithTier(id, userId)
  if (!f) return null

  const activityRatings = db
    .select({
      id: friendActivity.id,
      activityId: friendActivity.activityId,
      rating: friendActivity.rating,
      activityName: activity.name,
      activityIcon: activity.icon,
      activitySortOrder: activity.sortOrder,
    })
    .from(friendActivity)
    .innerJoin(activity, eq(friendActivity.activityId, activity.id))
    .where(eq(friendActivity.friendId, id))
    .orderBy(asc(activity.sortOrder))
    .all()

  const gifts = db
    .select()
    .from(giftIdea)
    .where(eq(giftIdea.friendId, id))
    .orderBy(desc(giftIdea.createdAt))
    .all()

  const availabilities = db
    .select()
    .from(availability)
    .where(eq(availability.friendId, id))
    .orderBy(asc(availability.startDate))
    .all()

  const connectionsAsA = db
    .select({
      id: friendConnection.id,
      type: friendConnection.type,
      strength: friendConnection.strength,
      howTheyMet: friendConnection.howTheyMet,
      startDate: friendConnection.startDate,
      endDate: friendConnection.endDate,
      notes: friendConnection.notes,
      createdAt: friendConnection.createdAt,
      otherFriendId: friend.id,
      otherFriendName: friend.name,
    })
    .from(friendConnection)
    .innerJoin(friend, eq(friendConnection.friendBId, friend.id))
    .where(eq(friendConnection.friendAId, id))
    .orderBy(desc(friendConnection.createdAt))
    .all()

  const connectionsAsB = db
    .select({
      id: friendConnection.id,
      type: friendConnection.type,
      strength: friendConnection.strength,
      howTheyMet: friendConnection.howTheyMet,
      startDate: friendConnection.startDate,
      endDate: friendConnection.endDate,
      notes: friendConnection.notes,
      createdAt: friendConnection.createdAt,
      otherFriendId: friend.id,
      otherFriendName: friend.name,
    })
    .from(friendConnection)
    .innerJoin(friend, eq(friendConnection.friendAId, friend.id))
    .where(eq(friendConnection.friendBId, id))
    .orderBy(desc(friendConnection.createdAt))
    .all()

  const connections = [...connectionsAsA, ...connectionsAsB]

  const invitations = db
    .select({
      id: eventInvitation.id,
      status: eventInvitation.status,
      attended: eventInvitation.attended,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventStatus: event.status,
    })
    .from(eventInvitation)
    .innerJoin(event, eq(eventInvitation.eventId, event.id))
    .where(eq(eventInvitation.friendId, id))
    .orderBy(desc(event.date))
    .all()

  const notes = db
    .select()
    .from(note)
    .where(and(eq(note.friendId, id), eq(note.userId, userId)))
    .orderBy(desc(note.createdAt))
    .all()

  return {
    ...f,
    activityRatings,
    gifts,
    availabilities,
    connections,
    invitations,
    notes,
  }
}

function normalizeEmpty(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

export function createFriend(data: FriendInput, userId: string) {
  const normalized = normalizeEmpty(data as Record<string, unknown>)
  const created = db
    .insert(friend)
    .values({ ...normalized, userId } as typeof friend.$inferInsert)
    .returning()
    .get()
  return created
}

export function updateFriend(id: string, data: FriendInput, userId: string) {
  const normalized = normalizeEmpty(data as Record<string, unknown>)
  db.update(friend)
    .set({ ...normalized, updatedAt: new Date() })
    .where(and(eq(friend.id, id), eq(friend.userId, userId)))
    .run()
}

export function deleteFriend(id: string, userId: string) {
  db.delete(friend)
    .where(and(eq(friend.id, id), eq(friend.userId, userId)))
    .run()
}

export function getFriendCount(userId: string, tierId?: string) {
  const conditions = tierId
    ? and(eq(friend.userId, userId), eq(friend.closenessTierId, tierId))
    : eq(friend.userId, userId)

  const result = db
    .select({ count: count() })
    .from(friend)
    .where(conditions)
    .get()
  return result?.count ?? 0
}

/** Get all friends (id + name) for dropdowns and selectors */
export function getFriendOptions(userId: string) {
  return db
    .select({ id: friend.id, name: friend.name })
    .from(friend)
    .where(eq(friend.userId, userId))
    .orderBy(asc(friend.name))
    .all()
}
