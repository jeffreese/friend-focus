import { and, desc, eq, like } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { event, friend, note } from '~/db/schema'

export function getNotes(
  userId: string,
  filters?: {
    type?: string
    friendId?: string
    eventId?: string
    search?: string
  },
) {
  let conditions = eq(note.userId, userId)

  if (filters?.type) {
    conditions = and(conditions, eq(note.type, filters.type))!
  }
  if (filters?.friendId) {
    conditions = and(conditions, eq(note.friendId, filters.friendId))!
  }
  if (filters?.eventId) {
    conditions = and(conditions, eq(note.eventId, filters.eventId))!
  }
  if (filters?.search) {
    conditions = and(conditions, like(note.content, `%${filters.search}%`))!
  }

  return db
    .select({
      id: note.id,
      content: note.content,
      type: note.type,
      friendId: note.friendId,
      friendName: friend.name,
      eventId: note.eventId,
      eventName: event.name,
      userId: note.userId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })
    .from(note)
    .leftJoin(friend, eq(note.friendId, friend.id))
    .leftJoin(event, eq(note.eventId, event.id))
    .where(conditions)
    .orderBy(desc(note.createdAt))
    .all()
}

export function createNote(
  data: {
    content: string
    type: string
    friendId?: string | null
    eventId?: string | null
  },
  userId: string,
) {
  const created = db
    .insert(note)
    .values({
      content: data.content,
      type: data.type,
      friendId: data.friendId || null,
      eventId: data.eventId || null,
      userId,
    })
    .returning()
    .get()
  return created
}

export function updateNote(id: string, content: string, userId: string) {
  db.update(note)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(note.id, id), eq(note.userId, userId)))
    .run()
}

export function deleteNote(id: string, userId: string) {
  db.delete(note)
    .where(and(eq(note.id, id), eq(note.userId, userId)))
    .run()
}
