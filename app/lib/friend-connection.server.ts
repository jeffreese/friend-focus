import { and, desc, eq, or } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { closenessTier, friend, friendConnection } from '~/db/schema'

export function getConnections(userId: string, friendId?: string) {
  if (friendId) {
    const asA = db
      .select({
        id: friendConnection.id,
        friendAId: friendConnection.friendAId,
        friendBId: friendConnection.friendBId,
        type: friendConnection.type,
        strength: friendConnection.strength,
        howTheyMet: friendConnection.howTheyMet,
        startDate: friendConnection.startDate,
        endDate: friendConnection.endDate,
        notes: friendConnection.notes,
        createdAt: friendConnection.createdAt,
      })
      .from(friendConnection)
      .where(
        or(
          eq(friendConnection.friendAId, friendId),
          eq(friendConnection.friendBId, friendId),
        ),
      )
      .orderBy(desc(friendConnection.createdAt))
      .all()

    return asA
  }

  // All connections for this user's friends
  return db
    .select({
      id: friendConnection.id,
      friendAId: friendConnection.friendAId,
      friendBId: friendConnection.friendBId,
      type: friendConnection.type,
      strength: friendConnection.strength,
      howTheyMet: friendConnection.howTheyMet,
      startDate: friendConnection.startDate,
      endDate: friendConnection.endDate,
      notes: friendConnection.notes,
      createdAt: friendConnection.createdAt,
    })
    .from(friendConnection)
    .innerJoin(friend, eq(friendConnection.friendAId, friend.id))
    .where(eq(friend.userId, userId))
    .orderBy(desc(friendConnection.createdAt))
    .all()
}

export function getConnection(id: string) {
  return db
    .select()
    .from(friendConnection)
    .where(eq(friendConnection.id, id))
    .get()
}

export function createConnection(
  data: {
    friendAId: string
    friendBId: string
    type?: string | null
    strength?: number
    howTheyMet?: string | null
    startDate?: string | null
    endDate?: string | null
    notes?: string | null
  },
  userId: string,
) {
  // Verify both friends belong to user
  const fA = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, data.friendAId), eq(friend.userId, userId)))
    .get()
  const fB = db
    .select({ id: friend.id })
    .from(friend)
    .where(and(eq(friend.id, data.friendBId), eq(friend.userId, userId)))
    .get()
  if (!fA || !fB) throw new Error('Friend not found')

  // Enforce canonical ordering
  let { friendAId, friendBId } = data
  if (friendAId > friendBId) {
    ;[friendAId, friendBId] = [friendBId, friendAId]
  }

  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )

  const created = db
    .insert(friendConnection)
    .values({
      ...normalized,
      friendAId,
      friendBId,
      strength: data.strength ?? 3,
    } as typeof friendConnection.$inferInsert)
    .returning()
    .get()
  return created
}

export function updateConnection(
  id: string,
  data: {
    type?: string | null
    strength?: number
    howTheyMet?: string | null
    startDate?: string | null
    endDate?: string | null
    notes?: string | null
  },
) {
  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )

  db.update(friendConnection)
    .set({ ...normalized, updatedAt: new Date() })
    .where(eq(friendConnection.id, id))
    .run()
}

export function deleteConnection(id: string) {
  db.delete(friendConnection).where(eq(friendConnection.id, id)).run()
}

export function getGraphData(userId: string) {
  const friends = db
    .select({
      id: friend.id,
      name: friend.name,
      tierColor: closenessTier.color,
      tierLabel: closenessTier.label,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(eq(friend.userId, userId))
    .all()

  // Get connections only for this user's friends
  const friendIds = new Set(friends.map(f => f.id))
  const connections = db
    .select({
      friendAId: friendConnection.friendAId,
      friendBId: friendConnection.friendBId,
      strength: friendConnection.strength,
      type: friendConnection.type,
    })
    .from(friendConnection)
    .all()
    .filter(c => friendIds.has(c.friendAId) && friendIds.has(c.friendBId))

  return { friends, connections }
}
