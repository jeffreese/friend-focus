import { and, asc, eq } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { activity, friendActivity } from '~/db/schema'

export function getFriendActivities(friendId: string) {
  return db
    .select({
      id: friendActivity.id,
      friendId: friendActivity.friendId,
      activityId: friendActivity.activityId,
      rating: friendActivity.rating,
      activityName: activity.name,
      activityIcon: activity.icon,
      activitySortOrder: activity.sortOrder,
    })
    .from(friendActivity)
    .innerJoin(activity, eq(friendActivity.activityId, activity.id))
    .where(eq(friendActivity.friendId, friendId))
    .orderBy(asc(activity.sortOrder))
    .all()
}

export function upsertFriendActivity(
  friendId: string,
  activityId: string,
  rating: number,
) {
  // Check if exists
  const existing = db
    .select()
    .from(friendActivity)
    .where(
      and(
        eq(friendActivity.friendId, friendId),
        eq(friendActivity.activityId, activityId),
      ),
    )
    .get()

  if (existing) {
    db.update(friendActivity)
      .set({ rating })
      .where(eq(friendActivity.id, existing.id))
      .run()
    return existing
  }

  const created = db
    .insert(friendActivity)
    .values({ friendId, activityId, rating })
    .returning()
    .get()
  return created
}

export function deleteFriendActivity(friendId: string, activityId: string) {
  db.delete(friendActivity)
    .where(
      and(
        eq(friendActivity.friendId, friendId),
        eq(friendActivity.activityId, activityId),
      ),
    )
    .run()
}

export function bulkUpsertFriendActivities(
  friendId: string,
  ratings: Array<{ activityId: string; rating: number }>,
) {
  // Delete ratings not in the new set
  const newActivityIds = new Set(ratings.map(r => r.activityId))
  const existingRatings = db
    .select()
    .from(friendActivity)
    .where(eq(friendActivity.friendId, friendId))
    .all()

  for (const existing of existingRatings) {
    if (!newActivityIds.has(existing.activityId)) {
      db.delete(friendActivity).where(eq(friendActivity.id, existing.id)).run()
    }
  }

  // Upsert each rating
  for (const r of ratings) {
    upsertFriendActivity(friendId, r.activityId, r.rating)
  }
}
