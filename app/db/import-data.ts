/**
 * Import data from friend-tracker (Prisma/SQLite) into friend-focus (Drizzle/SQLite).
 *
 * Reads JSON backup files from app/db/backup/ and inserts them into the
 * friend-focus database, creating the target user account if it doesn't exist.
 *
 * Usage: tsx app/db/import-data.ts
 *
 * IMPORTANT: This does NOT clear existing data — it only inserts. If the
 * target user already has data, you may get unique constraint errors.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// ─── Config ─────────────────────────────────────────────────────────────────
const TARGET_EMAIL = 'thermyte@gmail.com'
const TARGET_PASSWORD = 'h3lly3ah!!'
const TARGET_NAME = 'Jeff'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = resolve(__dirname, 'backup')

// ─── Setup ──────────────────────────────────────────────────────────────────
const url = process.env.DATABASE_URL || 'sqlite.db'
const sqlite = new Database(url)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
})

function loadJson<T>(filename: string): T {
  const path = resolve(BACKUP_DIR, filename)
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

function toTimestamp(isoOrDatetime: string | null): number {
  if (!isoOrDatetime) return Date.now()
  const d = new Date(isoOrDatetime)
  return Number.isNaN(d.getTime()) ? Date.now() : d.getTime()
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function importData() {
  console.log('Importing data from friend-tracker backup...')

  // 1. Get or create user
  const existingUser = db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, TARGET_EMAIL))
    .get()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    console.log(`Using existing user: ${TARGET_EMAIL} (${userId})`)
  } else {
    const result = await auth.api.signUpEmail({
      body: {
        name: TARGET_NAME,
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
      },
    })
    if (!result) throw new Error('Failed to create user')
    userId = result.user.id
    console.log(`Created user: ${TARGET_EMAIL} (${userId})`)
  }

  // 2. Clear existing application data for this user (preserves auth data)
  console.log('Clearing existing application data for user...')
  db.delete(schema.note).where(eq(schema.note.userId, userId)).run()
  db.delete(schema.eventInvitation).run() // cascades via event
  db.delete(schema.event).where(eq(schema.event.userId, userId)).run()
  db.delete(schema.giftIdea).run() // cascades via friend
  db.delete(schema.availability).run() // cascades via friend
  db.delete(schema.friendConnection).run() // cascades via friend
  db.delete(schema.friendActivity).run() // cascades via friend
  db.delete(schema.friend).where(eq(schema.friend.userId, userId)).run()
  db.delete(schema.activity).where(eq(schema.activity.userId, userId)).run()
  db.delete(schema.closenessTier)
    .where(eq(schema.closenessTier.userId, userId))
    .run()

  // 3. Import closeness tiers (build old→new ID map)
  type OldTier = {
    id: string
    label: string
    sortOrder: number
    color: string | null
  }
  const oldTiers = loadJson<OldTier[]>('closeness-tiers.json')
  const tierIdMap = new Map<string, string>()

  console.log(`Importing ${oldTiers.length} closeness tiers...`)
  for (const t of oldTiers) {
    const newId = crypto.randomUUID()
    tierIdMap.set(t.id, newId)
    db.insert(schema.closenessTier)
      .values({
        id: newId,
        label: t.label,
        sortOrder: t.sortOrder,
        color: t.color,
        userId,
      })
      .run()
  }

  // 4. Import activities (build old→new ID map)
  type OldActivity = {
    id: string
    name: string
    icon: string | null
    isDefault: number | boolean
    sortOrder: number
  }
  const oldActivities = loadJson<OldActivity[]>('activities.json')
  const activityIdMap = new Map<string, string>()

  console.log(`Importing ${oldActivities.length} activities...`)
  for (const a of oldActivities) {
    const newId = crypto.randomUUID()
    activityIdMap.set(a.id, newId)
    db.insert(schema.activity)
      .values({
        id: newId,
        name: a.name,
        icon: a.icon,
        isDefault: !!a.isDefault,
        sortOrder: a.sortOrder,
        userId,
      })
      .run()
  }

  // 5. Import friends (build old→new ID map)
  type OldFriend = {
    id: string
    name: string
    photo: string | null
    phone: string | null
    email: string | null
    socialHandles: string | null
    birthday: string | null
    location: string | null
    loveLanguage: string | null
    favoriteFood: string | null
    dietaryRestrictions: string | null
    employer: string | null
    occupation: string | null
    personalNotes: string | null
    careModeActive: number | boolean
    careModeNote: string | null
    careModeReminder: string | null
    careModeStartedAt: string | null
    closenessTierId: string | null
    createdAt: string
    updatedAt: string
  }
  const oldFriends = loadJson<OldFriend[]>('friends.json')
  const friendIdMap = new Map<string, string>()

  console.log(`Importing ${oldFriends.length} friends...`)
  for (const f of oldFriends) {
    const newId = crypto.randomUUID()
    friendIdMap.set(f.id, newId)
    db.insert(schema.friend)
      .values({
        id: newId,
        name: f.name,
        photo: f.photo,
        phone: f.phone,
        email: f.email,
        socialHandles: f.socialHandles,
        birthday: f.birthday,
        location: f.location,
        loveLanguage: f.loveLanguage,
        favoriteFood: f.favoriteFood,
        dietaryRestrictions: f.dietaryRestrictions,
        employer: f.employer,
        occupation: f.occupation,
        personalNotes: f.personalNotes,
        careModeActive: !!f.careModeActive,
        careModeNote: f.careModeNote,
        careModeReminder: f.careModeReminder,
        careModeStartedAt: f.careModeStartedAt,
        closenessTierId: f.closenessTierId
          ? (tierIdMap.get(f.closenessTierId) ?? null)
          : null,
        userId,
        createdAt: new Date(toTimestamp(f.createdAt)),
        updatedAt: new Date(toTimestamp(f.updatedAt)),
      })
      .run()
  }

  // 6. Import friend activities
  type OldFriendActivity = {
    id: string
    friendId: string
    activityId: string
    rating: number
  }
  const oldFriendActivities = loadJson<OldFriendActivity[]>(
    'friend-activities.json',
  )

  console.log(
    `Importing ${oldFriendActivities.length} friend activity ratings...`,
  )
  let faSkipped = 0
  for (const fa of oldFriendActivities) {
    const newFriendId = friendIdMap.get(fa.friendId)
    const newActivityId = activityIdMap.get(fa.activityId)
    if (!newFriendId || !newActivityId) {
      faSkipped++
      continue
    }
    db.insert(schema.friendActivity)
      .values({
        id: crypto.randomUUID(),
        friendId: newFriendId,
        activityId: newActivityId,
        rating: fa.rating,
      })
      .run()
  }
  if (faSkipped) console.log(`  Skipped ${faSkipped} (missing friend/activity)`)

  // 7. Import friend connections
  type OldConnection = {
    id: string
    friendAId: string
    friendBId: string
    strength: number
    howTheyMet: string | null
    notes: string | null
    type: string | null
    startDate: string | null
    endDate: string | null
    createdAt: string
    updatedAt: string
  }
  const oldConnections = loadJson<OldConnection[]>('friend-connections.json')

  console.log(`Importing ${oldConnections.length} friend connections...`)
  let connSkipped = 0
  for (const c of oldConnections) {
    const newA = friendIdMap.get(c.friendAId)
    const newB = friendIdMap.get(c.friendBId)
    if (!newA || !newB) {
      connSkipped++
      continue
    }
    db.insert(schema.friendConnection)
      .values({
        id: crypto.randomUUID(),
        friendAId: newA,
        friendBId: newB,
        strength: c.strength,
        howTheyMet: c.howTheyMet,
        notes: c.notes,
        type: c.type,
        startDate: c.startDate,
        endDate: c.endDate,
        createdAt: new Date(toTimestamp(c.createdAt)),
        updatedAt: new Date(toTimestamp(c.updatedAt)),
      })
      .run()
  }
  if (connSkipped) console.log(`  Skipped ${connSkipped} (missing friend)`)

  // 8. Import events (build old→new ID map)
  type OldEvent = {
    id: string
    name: string
    activityId: string | null
    date: string | null
    time: string | null
    location: string | null
    capacity: number | null
    vibe: string | null
    status: string
    createdAt: string
    updatedAt: string
  }
  const oldEvents = loadJson<OldEvent[]>('events.json')
  const eventIdMap = new Map<string, string>()

  console.log(`Importing ${oldEvents.length} events...`)
  for (const e of oldEvents) {
    const newId = crypto.randomUUID()
    eventIdMap.set(e.id, newId)
    db.insert(schema.event)
      .values({
        id: newId,
        name: e.name,
        activityId: e.activityId
          ? (activityIdMap.get(e.activityId) ?? null)
          : null,
        date: e.date,
        time: e.time,
        location: e.location,
        capacity: e.capacity,
        vibe: e.vibe,
        status: e.status,
        userId,
        createdAt: new Date(toTimestamp(e.createdAt)),
        updatedAt: new Date(toTimestamp(e.updatedAt)),
      })
      .run()
  }

  // 9. Import event invitations
  type OldInvitation = {
    id: string
    eventId: string
    friendId: string
    status: string
    mustInvite: number | boolean
    mustExclude: number | boolean
    attended: number | boolean | null
    createdAt: string
    updatedAt: string
  }
  const oldInvitations = loadJson<OldInvitation[]>('event-invitations.json')

  console.log(`Importing ${oldInvitations.length} event invitations...`)
  let invSkipped = 0
  for (const inv of oldInvitations) {
    const newEventId = eventIdMap.get(inv.eventId)
    const newFriendId = friendIdMap.get(inv.friendId)
    if (!newEventId || !newFriendId) {
      invSkipped++
      continue
    }
    db.insert(schema.eventInvitation)
      .values({
        id: crypto.randomUUID(),
        eventId: newEventId,
        friendId: newFriendId,
        status: inv.status,
        mustInvite: !!inv.mustInvite,
        mustExclude: !!inv.mustExclude,
        attended: inv.attended === null ? null : !!inv.attended,
        createdAt: new Date(toTimestamp(inv.createdAt)),
        updatedAt: new Date(toTimestamp(inv.updatedAt)),
      })
      .run()
  }
  if (invSkipped) console.log(`  Skipped ${invSkipped} (missing event/friend)`)

  console.log('\nImport complete!')
  console.log(`  User:        ${TARGET_EMAIL}`)
  console.log(`  Tiers:       ${oldTiers.length}`)
  console.log(`  Activities:  ${oldActivities.length}`)
  console.log(`  Friends:     ${oldFriends.length}`)
  console.log(`  Ratings:     ${oldFriendActivities.length - faSkipped}`)
  console.log(`  Connections: ${oldConnections.length - connSkipped}`)
  console.log(`  Events:      ${oldEvents.length}`)
  console.log(`  Invitations: ${oldInvitations.length - invSkipped}`)
}

importData().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
