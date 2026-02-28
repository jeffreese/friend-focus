import { and, asc, count, desc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { closenessTier, friend } from '~/db/schema'

export function getClosenessTiers(userId: string) {
  return db
    .select({
      id: closenessTier.id,
      label: closenessTier.label,
      sortOrder: closenessTier.sortOrder,
      color: closenessTier.color,
      userId: closenessTier.userId,
      createdAt: closenessTier.createdAt,
      friendCount: count(friend.id),
    })
    .from(closenessTier)
    .leftJoin(
      friend,
      and(
        eq(friend.closenessTierId, closenessTier.id),
        eq(friend.userId, userId),
      ),
    )
    .where(eq(closenessTier.userId, userId))
    .groupBy(closenessTier.id)
    .orderBy(asc(closenessTier.sortOrder))
    .all()
}

export function getClosenessTier(id: string, userId: string) {
  return db
    .select()
    .from(closenessTier)
    .where(and(eq(closenessTier.id, id), eq(closenessTier.userId, userId)))
    .get()
}

export function createClosenessTier(
  data: { label: string; color?: string | null },
  userId: string,
) {
  const maxRow = db
    .select({ sortOrder: closenessTier.sortOrder })
    .from(closenessTier)
    .where(eq(closenessTier.userId, userId))
    .orderBy(desc(closenessTier.sortOrder))
    .limit(1)
    .get()
  const nextOrder = (maxRow?.sortOrder ?? 0) + 1

  const created = db
    .insert(closenessTier)
    .values({
      label: data.label,
      color: data.color ?? null,
      sortOrder: nextOrder,
      userId,
    })
    .returning()
    .get()
  return created
}

export function updateClosenessTier(
  id: string,
  data: { label: string; color?: string | null },
  userId: string,
) {
  db.update(closenessTier)
    .set({ label: data.label, color: data.color ?? null })
    .where(and(eq(closenessTier.id, id), eq(closenessTier.userId, userId)))
    .run()
}

export function deleteClosenessTier(id: string, userId: string) {
  db.delete(closenessTier)
    .where(and(eq(closenessTier.id, id), eq(closenessTier.userId, userId)))
    .run()
}

export function reorderClosenessTiers(orderedIds: string[], userId: string) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(closenessTier)
      .set({ sortOrder: i + 1 })
      .where(
        and(
          eq(closenessTier.id, orderedIds[i]),
          eq(closenessTier.userId, userId),
        ),
      )
      .run()
  }
}
