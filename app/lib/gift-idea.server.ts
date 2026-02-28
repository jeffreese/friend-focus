import { and, desc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { friend, giftIdea } from '~/db/schema'
import type { GiftIdeaInput } from './schemas'

function normalizeEmpty(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

export function getGiftIdeasForFriend(friendId: string) {
  return db
    .select()
    .from(giftIdea)
    .where(eq(giftIdea.friendId, friendId))
    .orderBy(desc(giftIdea.createdAt))
    .all()
}

export function createGiftIdea(
  friendId: string,
  data: GiftIdeaInput,
  userId: string,
) {
  // Verify friend belongs to user
  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .get()
  if (!f) throw new Error('Friend not found')

  const normalized = normalizeEmpty(data as Record<string, unknown>)
  const created = db
    .insert(giftIdea)
    .values({ ...normalized, friendId } as typeof giftIdea.$inferInsert)
    .returning()
    .get()
  return created
}

export function updateGiftIdea(
  id: string,
  data: GiftIdeaInput,
  userId: string,
) {
  // Verify the gift belongs to a friend owned by this user
  const gift = db.select().from(giftIdea).where(eq(giftIdea.id, id)).get()
  if (!gift) throw new Error('Gift not found')

  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, gift.friendId), eq(friend.userId, userId)))
    .get()
  if (!f) throw new Error('Friend not found')

  const normalized = normalizeEmpty(data as Record<string, unknown>)
  db.update(giftIdea).set(normalized).where(eq(giftIdea.id, id)).run()
}

export function deleteGiftIdea(id: string, userId: string) {
  const gift = db.select().from(giftIdea).where(eq(giftIdea.id, id)).get()
  if (!gift) return

  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, gift.friendId), eq(friend.userId, userId)))
    .get()
  if (!f) return

  db.delete(giftIdea).where(eq(giftIdea.id, id)).run()
}

export function toggleGiftPurchased(id: string, userId: string) {
  const gift = db.select().from(giftIdea).where(eq(giftIdea.id, id)).get()
  if (!gift) return null

  const f = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, gift.friendId), eq(friend.userId, userId)))
    .get()
  if (!f) return null

  db.update(giftIdea)
    .set({
      purchased: !gift.purchased,
      purchasedAt: gift.purchased
        ? null
        : new Date().toISOString().split('T')[0],
    })
    .where(eq(giftIdea.id, id))
    .run()

  return db.select().from(giftIdea).where(eq(giftIdea.id, id)).get()
}
