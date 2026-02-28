import { and, asc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { availability, friend } from '~/db/schema'
import type { AvailabilityInput } from './schemas'

export function getAvailabilities(friendId: string) {
  return db
    .select()
    .from(availability)
    .where(eq(availability.friendId, friendId))
    .orderBy(asc(availability.startDate))
    .all()
}

export function createAvailability(
  friendId: string,
  data: AvailabilityInput,
  userId: string,
) {
  // Verify friend belongs to user
  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .get()
  if (!f) throw new Error('Friend not found')

  const created = db
    .insert(availability)
    .values({ ...data, friendId })
    .returning()
    .get()
  return created
}

export function deleteAvailability(id: string, userId: string) {
  const avail = db
    .select()
    .from(availability)
    .where(eq(availability.id, id))
    .get()
  if (!avail) return

  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, avail.friendId), eq(friend.userId, userId)))
    .get()
  if (!f) return

  db.delete(availability).where(eq(availability.id, id)).run()
}
