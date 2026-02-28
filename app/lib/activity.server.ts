import { and, asc, count, desc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { activity, friendActivity } from '~/db/schema'

export function getActivities(userId: string) {
  return db
    .select({
      id: activity.id,
      name: activity.name,
      icon: activity.icon,
      isDefault: activity.isDefault,
      sortOrder: activity.sortOrder,
      userId: activity.userId,
      createdAt: activity.createdAt,
      ratingCount: count(friendActivity.id),
    })
    .from(activity)
    .leftJoin(friendActivity, eq(friendActivity.activityId, activity.id))
    .where(eq(activity.userId, userId))
    .groupBy(activity.id)
    .orderBy(asc(activity.sortOrder))
    .all()
}

export function getActivity(id: string, userId: string) {
  return db
    .select()
    .from(activity)
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .get()
}

export function createActivity(
  data: { name: string; icon?: string | null; isDefault?: boolean },
  userId: string,
) {
  const maxRow = db
    .select({ sortOrder: activity.sortOrder })
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.sortOrder))
    .limit(1)
    .get()
  const nextOrder = (maxRow?.sortOrder ?? -1) + 1

  const created = db
    .insert(activity)
    .values({
      name: data.name,
      icon: data.icon ?? null,
      isDefault: data.isDefault ?? false,
      sortOrder: nextOrder,
      userId,
    })
    .returning()
    .get()
  return created
}

export function updateActivity(
  id: string,
  data: { name: string; icon?: string | null; isDefault?: boolean },
  userId: string,
) {
  db.update(activity)
    .set({
      name: data.name,
      icon: data.icon ?? null,
      isDefault: data.isDefault ?? false,
    })
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .run()
}

export function deleteActivity(id: string, userId: string) {
  db.delete(activity)
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .run()
}

export function reorderActivities(orderedIds: string[], userId: string) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(activity)
      .set({ sortOrder: i })
      .where(and(eq(activity.id, orderedIds[i]), eq(activity.userId, userId)))
      .run()
  }
}
