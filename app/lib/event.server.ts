import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import {
  activity,
  closenessTier,
  event,
  eventInvitation,
  friend,
  note,
} from '~/db/schema'
import { computeCalendarRsvpUpdates } from './calendar-rsvp'
import type { EventInput } from './schemas'
import { normalizeEmpty } from './utils'

export type { CalendarRsvpInput, GoogleAttendeeInput } from './calendar-rsvp'

export function getEvents(userId: string, status?: string) {
  const conditions = status
    ? and(eq(event.userId, userId), eq(event.status, status))
    : eq(event.userId, userId)

  return db
    .select({
      id: event.id,
      name: event.name,
      activityId: event.activityId,
      activityName: activity.name,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      vibe: event.vibe,
      status: event.status,
      userId: event.userId,
      createdAt: event.createdAt,
      invitationCount: count(eventInvitation.id),
    })
    .from(event)
    .leftJoin(activity, eq(event.activityId, activity.id))
    .leftJoin(eventInvitation, eq(eventInvitation.eventId, event.id))
    .where(conditions)
    .groupBy(event.id)
    .orderBy(desc(event.date))
    .all()
}

export function getEvent(id: string, userId: string) {
  return db
    .select()
    .from(event)
    .where(and(eq(event.id, id), eq(event.userId, userId)))
    .get()
}

export function getEventDetail(id: string, userId: string) {
  const e = db
    .select({
      id: event.id,
      name: event.name,
      activityId: event.activityId,
      activityName: activity.name,
      date: event.date,
      time: event.time,
      location: event.location,
      locationStreet: event.locationStreet,
      locationCity: event.locationCity,
      locationState: event.locationState,
      locationZip: event.locationZip,
      locationCountry: event.locationCountry,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
      locationPlaceId: event.locationPlaceId,
      capacity: event.capacity,
      vibe: event.vibe,
      status: event.status,
      userId: event.userId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      googleCalendarEventId: event.googleCalendarEventId,
      googleCalendarLink: event.googleCalendarLink,
    })
    .from(event)
    .leftJoin(activity, eq(event.activityId, activity.id))
    .where(and(eq(event.id, id), eq(event.userId, userId)))
    .get()

  if (!e) return null

  const invitations = db
    .select({
      id: eventInvitation.id,
      friendId: eventInvitation.friendId,
      friendName: friend.name,
      friendEmail: friend.email,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
      tierSortOrder: closenessTier.sortOrder,
      status: eventInvitation.status,
      attended: eventInvitation.attended,
      calendarInviteSent: eventInvitation.calendarInviteSent,
      mustInvite: eventInvitation.mustInvite,
      mustExclude: eventInvitation.mustExclude,
      createdAt: eventInvitation.createdAt,
    })
    .from(eventInvitation)
    .innerJoin(friend, eq(eventInvitation.friendId, friend.id))
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(eq(eventInvitation.eventId, id))
    .orderBy(eventInvitation.createdAt)
    .all()

  const notes = db
    .select()
    .from(note)
    .where(and(eq(note.eventId, id), eq(note.userId, userId)))
    .orderBy(desc(note.createdAt))
    .all()

  return { ...e, invitations, notes }
}

export function createEvent(data: EventInput, userId: string) {
  const normalized = normalizeEmpty(data as Record<string, unknown>)
  const created = db
    .insert(event)
    .values({ ...normalized, userId } as typeof event.$inferInsert)
    .returning()
    .get()
  return created
}

export function updateEvent(
  id: string,
  data: Partial<EventInput>,
  userId: string,
) {
  const normalized = normalizeEmpty(data as Record<string, unknown>)
  db.update(event)
    .set({ ...normalized, updatedAt: new Date() })
    .where(and(eq(event.id, id), eq(event.userId, userId)))
    .run()
}

export function deleteEvent(id: string, userId: string) {
  db.delete(event)
    .where(and(eq(event.id, id), eq(event.userId, userId)))
    .run()
}

export function addInvitation(eventId: string, friendId: string) {
  const created = db
    .insert(eventInvitation)
    .values({ eventId, friendId })
    .returning()
    .get()
  return created
}

export function updateInvitation(
  id: string,
  data: {
    status?: string
    attended?: boolean | null
    mustInvite?: boolean
    mustExclude?: boolean
  },
) {
  db.update(eventInvitation)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eventInvitation.id, id))
    .run()
}

export function removeInvitation(id: string) {
  db.delete(eventInvitation).where(eq(eventInvitation.id, id)).run()
}

export function getEventCount(userId: string, status?: string) {
  const conditions = status
    ? and(eq(event.userId, userId), eq(event.status, status))
    : eq(event.userId, userId)
  const result = db
    .select({ count: count() })
    .from(event)
    .where(conditions)
    .get()
  return result?.count ?? 0
}

export function setGoogleCalendarEventId(
  eventId: string,
  googleCalendarEventId: string,
  googleCalendarLink: string,
  userId: string,
) {
  db.update(event)
    .set({ googleCalendarEventId, googleCalendarLink, updatedAt: new Date() })
    .where(and(eq(event.id, eventId), eq(event.userId, userId)))
    .run()
}

export function clearGoogleCalendarEventId(eventId: string, userId: string) {
  db.update(event)
    .set({
      googleCalendarEventId: null,
      googleCalendarLink: null,
      updatedAt: new Date(),
    })
    .where(and(eq(event.id, eventId), eq(event.userId, userId)))
    .run()
}

export function getInvitationWithEmail(invitationId: string) {
  return db
    .select({
      id: eventInvitation.id,
      friendId: eventInvitation.friendId,
      friendName: friend.name,
      friendEmail: friend.email,
      calendarInviteSent: eventInvitation.calendarInviteSent,
      status: eventInvitation.status,
      eventId: eventInvitation.eventId,
    })
    .from(eventInvitation)
    .innerJoin(friend, eq(eventInvitation.friendId, friend.id))
    .where(eq(eventInvitation.id, invitationId))
    .get()
}

export function markCalendarInviteSent(invitationId: string) {
  db.update(eventInvitation)
    .set({ calendarInviteSent: true, updatedAt: new Date() })
    .where(eq(eventInvitation.id, invitationId))
    .run()
}

/**
 * Sync RSVP statuses from Google Calendar attendee responses to local
 * invitations. Returns the number of invitations updated.
 */
export function syncCalendarRsvps(
  invitations: Array<{
    id: string
    friendEmail: string | null
    calendarInviteSent: boolean
    status: string
  }>,
  googleAttendees: Array<{ email: string; responseStatus: string }>,
): number {
  const updates = computeCalendarRsvpUpdates(invitations, googleAttendees)
  for (const { invitationId, newStatus } of updates) {
    updateInvitation(invitationId, { status: newStatus })
  }
  return updates.length
}
