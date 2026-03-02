import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { friend, googleContactCache, userGoogleSync } from '~/db/schema'
import {
  calculateMatchScore,
  type MatchCandidate,
} from '~/lib/contact-matching'
import {
  downloadContactPhoto,
  fetchGoogleContact,
  fetchGoogleContactsList,
  type GoogleContact,
} from '~/lib/google-contacts.server'
import { deletePhoto, savePhoto } from '~/lib/photos.server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CachedContact {
  id: string
  resourceName: string
  displayName: string | null
  email: string | null
  phone: string | null
  address: string | null
  photoUrl: string | null
  etag: string | null
  fetchedAt: Date
}

export interface CachedContactWithStatus extends CachedContact {
  linkedFriendId: string | null
  linkedFriendName: string | null
  suggestedFriendId: string | null
  suggestedFriendName: string | null
  suggestedConfidence: number
  suggestedReasons: string[]
}

export interface FieldDiff {
  field: string
  label: string
  appValue: string | null
  googleValue: string | null
  googleValues?: Array<{ value: string; type?: string }> // for multi-value fields
}

export interface SyncResult {
  status: 'up-to-date' | 'changes-detected' | 'unlinked' | 'error'
  diffs?: FieldDiff[]
  reason?: string
  message?: string
}

// ─── Sync token management ──────────────────────────────────────────────────

export function getUserGoogleSync(userId: string) {
  return db
    .select()
    .from(userGoogleSync)
    .where(eq(userGoogleSync.userId, userId))
    .get()
}

function upsertUserGoogleSync(
  userId: string,
  data: {
    googleContactsSyncToken?: string | null
    lastBulkSyncAt?: Date
  },
) {
  const existing = getUserGoogleSync(userId)

  if (existing) {
    db.update(userGoogleSync)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userGoogleSync.userId, userId))
      .run()
  } else {
    db.insert(userGoogleSync)
      .values({
        userId,
        googleContactsSyncToken: data.googleContactsSyncToken,
        lastBulkSyncAt: data.lastBulkSyncAt,
        updatedAt: new Date(),
      })
      .run()
  }
}

// ─── Bulk sync: Google → Cache ──────────────────────────────────────────────

/**
 * Fetch all contacts from Google and upsert into the local cache.
 * Uses syncToken for incremental updates when available.
 */
export async function syncGoogleContactsToCache(
  userId: string,
): Promise<{ synced: number; errors: string[] }> {
  const syncSettings = getUserGoogleSync(userId)
  const syncToken = syncSettings?.googleContactsSyncToken || undefined
  const errors: string[] = []
  let synced = 0

  try {
    let pageToken: string | undefined
    let nextSyncToken: string | undefined
    let isFirstPage = true

    do {
      const result = await fetchGoogleContactsList(userId, {
        pageToken,
        syncToken: isFirstPage ? syncToken : undefined,
        pageSize: 100,
      })

      // If syncToken was invalid (410), retry full fetch
      if (
        isFirstPage &&
        syncToken &&
        !result.nextSyncToken &&
        result.contacts.length === 0
      ) {
        // Clear the invalid sync token and retry
        upsertUserGoogleSync(userId, { googleContactsSyncToken: null })
        return syncGoogleContactsToCache(userId)
      }

      for (const contact of result.contacts) {
        try {
          upsertCachedContact(userId, contact)
          synced++
        } catch (err) {
          errors.push(
            `Failed to cache ${contact.displayName || contact.resourceName}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          )
        }
      }

      pageToken = result.nextPageToken
      nextSyncToken = result.nextSyncToken
      isFirstPage = false
    } while (pageToken)

    // Store the sync token for next incremental fetch
    upsertUserGoogleSync(userId, {
      googleContactsSyncToken: nextSyncToken,
      lastBulkSyncAt: new Date(),
    })
  } catch (err) {
    errors.push(
      `Bulk sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }

  return { synced, errors }
}

function upsertCachedContact(userId: string, contact: GoogleContact) {
  const primaryEmail = contact.emails[0]?.value || null
  const primaryPhone = contact.phoneNumbers[0]?.value || null
  const primaryAddress = contact.addresses[0]?.formattedValue || null
  const primaryPhoto = contact.photos.find(p => !p.default)?.url || null

  const existing = db
    .select({ id: googleContactCache.id })
    .from(googleContactCache)
    .where(
      and(
        eq(googleContactCache.userId, userId),
        eq(googleContactCache.resourceName, contact.resourceName),
      ),
    )
    .get()

  if (existing) {
    db.update(googleContactCache)
      .set({
        displayName: contact.displayName,
        email: primaryEmail,
        phone: primaryPhone,
        address: primaryAddress,
        photoUrl: primaryPhoto,
        etag: contact.etag,
        rawJson: JSON.stringify(contact),
        fetchedAt: new Date(),
      })
      .where(eq(googleContactCache.id, existing.id))
      .run()
  } else {
    db.insert(googleContactCache)
      .values({
        resourceName: contact.resourceName,
        displayName: contact.displayName,
        email: primaryEmail,
        phone: primaryPhone,
        address: primaryAddress,
        photoUrl: primaryPhoto,
        etag: contact.etag,
        rawJson: JSON.stringify(contact),
        userId,
        fetchedAt: new Date(),
      })
      .run()
  }
}

// ─── Cache queries ──────────────────────────────────────────────────────────

/**
 * Get all cached contacts for a user, optionally filtered to those with phone numbers.
 */
export function getCachedContacts(
  userId: string,
  options?: { hasPhone?: boolean },
): CachedContact[] {
  const conditions = [eq(googleContactCache.userId, userId)]

  if (options?.hasPhone) {
    conditions.push(isNotNull(googleContactCache.phone))
  }

  return db
    .select({
      id: googleContactCache.id,
      resourceName: googleContactCache.resourceName,
      displayName: googleContactCache.displayName,
      email: googleContactCache.email,
      phone: googleContactCache.phone,
      address: googleContactCache.address,
      photoUrl: googleContactCache.photoUrl,
      etag: googleContactCache.etag,
      fetchedAt: googleContactCache.fetchedAt,
    })
    .from(googleContactCache)
    .where(and(...conditions))
    .all()
}

/**
 * Get cached contacts with their linked/suggested friend status.
 */
export function getCachedContactsWithStatus(
  userId: string,
  options?: { hasPhone?: boolean },
): CachedContactWithStatus[] {
  const contacts = getCachedContacts(userId, options)

  // Get all friends for matching
  const friends = db
    .select({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      phone: friend.phone,
      googleContactResourceName: friend.googleContactResourceName,
    })
    .from(friend)
    .where(eq(friend.userId, userId))
    .all()

  // Build lookup of resourceName → friend
  const linkedMap = new Map<string, { id: string; name: string }>()
  const unlinkedFriends: Array<{
    id: string
    name: string
    email: string | null
    phone: string | null
  }> = []

  for (const f of friends) {
    if (f.googleContactResourceName) {
      linkedMap.set(f.googleContactResourceName, {
        id: f.id,
        name: f.name,
      })
    } else {
      unlinkedFriends.push(f)
    }
  }

  return contacts.map(contact => {
    const linked = linkedMap.get(contact.resourceName)

    let suggestedFriendId: string | null = null
    let suggestedFriendName: string | null = null
    let suggestedConfidence = 0
    let suggestedReasons: string[] = []

    if (!linked) {
      // Try to find a suggested match from unlinked friends
      const contactCandidate: MatchCandidate = {
        name: contact.displayName || '',
        email: contact.email,
        phone: contact.phone,
      }

      let bestScore = 0
      for (const f of unlinkedFriends) {
        const result = calculateMatchScore(contactCandidate, {
          name: f.name,
          email: f.email,
          phone: f.phone,
        })
        if (result.confidence > bestScore) {
          bestScore = result.confidence
          suggestedFriendId = f.id
          suggestedFriendName = f.name
          suggestedConfidence = result.confidence
          suggestedReasons = result.reasons
        }
      }

      // Only suggest if above threshold
      if (bestScore < 0.5) {
        suggestedFriendId = null
        suggestedFriendName = null
        suggestedConfidence = 0
        suggestedReasons = []
      }
    }

    return {
      ...contact,
      linkedFriendId: linked?.id || null,
      linkedFriendName: linked?.name || null,
      suggestedFriendId,
      suggestedFriendName,
      suggestedConfidence,
      suggestedReasons,
    }
  })
}

/**
 * Get a single cached contact by resourceName.
 */
export function getCachedContact(
  userId: string,
  resourceName: string,
): CachedContact | null {
  return (
    db
      .select({
        id: googleContactCache.id,
        resourceName: googleContactCache.resourceName,
        displayName: googleContactCache.displayName,
        email: googleContactCache.email,
        phone: googleContactCache.phone,
        address: googleContactCache.address,
        photoUrl: googleContactCache.photoUrl,
        etag: googleContactCache.etag,
        fetchedAt: googleContactCache.fetchedAt,
      })
      .from(googleContactCache)
      .where(
        and(
          eq(googleContactCache.userId, userId),
          eq(googleContactCache.resourceName, resourceName),
        ),
      )
      .get() || null
  )
}

/**
 * Get the full raw JSON for a cached contact (includes multi-value fields).
 */
export function getCachedContactRawJson(
  userId: string,
  resourceName: string,
): GoogleContact | null {
  const row = db
    .select({ rawJson: googleContactCache.rawJson })
    .from(googleContactCache)
    .where(
      and(
        eq(googleContactCache.userId, userId),
        eq(googleContactCache.resourceName, resourceName),
      ),
    )
    .get()

  if (!row?.rawJson) return null
  return JSON.parse(row.rawJson) as GoogleContact
}

// ─── Link / unlink ──────────────────────────────────────────────────────────

export function linkFriendToGoogleContact(
  friendId: string,
  resourceName: string,
  etag: string,
  userId: string,
) {
  db.update(friend)
    .set({
      googleContactResourceName: resourceName,
      googleContactEtag: etag,
      lastGoogleSyncAt: new Date().toISOString(),
      updatedAt: new Date(),
    })
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .run()
}

export function unlinkFriendFromGoogleContact(
  friendId: string,
  userId: string,
) {
  db.update(friend)
    .set({
      googleContactResourceName: null,
      googleContactEtag: null,
      lastGoogleSyncAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .run()
}

// ─── Import contact as friend ───────────────────────────────────────────────

/**
 * Import a Google Contact as a new friend.
 * If the contact has multi-value fields, pass the selected values.
 */
export function importGoogleContactAsFriend(
  userId: string,
  resourceName: string,
  selectedFields?: {
    email?: string
    phone?: string
    address?: string
  },
): string {
  const cached = getCachedContact(userId, resourceName)
  if (!cached) {
    throw new Error('Contact not found in cache')
  }

  const rawContact = getCachedContactRawJson(userId, resourceName)

  // Use selected values or fall back to primary values from cache
  const email = selectedFields?.email ?? cached.email
  const phone = selectedFields?.phone ?? cached.phone
  const address = selectedFields?.address ?? cached.address

  // Extract additional fields from raw JSON
  let birthday: string | null = null
  let employer: string | null = null
  let occupation: string | null = null

  if (rawContact) {
    const bday = rawContact.birthdays?.[0]?.date
    if (bday?.month && bday?.day) {
      const y = bday.year ? String(bday.year).padStart(4, '0') : '0000'
      const m = String(bday.month).padStart(2, '0')
      const d = String(bday.day).padStart(2, '0')
      birthday = `${y}-${m}-${d}`
    }

    employer = rawContact.organizations?.[0]?.name || null
    occupation = rawContact.organizations?.[0]?.title || null
  }

  const result = db
    .insert(friend)
    .values({
      name: cached.displayName || 'Unnamed Contact',
      email: email || null,
      phone: phone || null,
      address: address || null,
      birthday,
      employer,
      occupation,
      googleContactResourceName: resourceName,
      googleContactEtag: cached.etag,
      lastGoogleSyncAt: new Date().toISOString(),
      userId,
    })
    .returning({ id: friend.id })
    .get()

  return result.id
}

// ─── Single friend sync ─────────────────────────────────────────────────────

/** Fields that sync between the app and Google Contacts. */
const SYNCABLE_FIELDS: Array<{
  field: string
  label: string
  getFriendValue: (f: FriendRow) => string | null
  getGoogleValue: (c: GoogleContact) => string | null
  getGoogleMultiValues?: (
    c: GoogleContact,
  ) => Array<{ value: string; type?: string }>
}> = [
  {
    field: 'name',
    label: 'Name',
    getFriendValue: f => f.name,
    getGoogleValue: c => c.displayName,
  },
  {
    field: 'email',
    label: 'Email',
    getFriendValue: f => f.email,
    getGoogleValue: c => c.emails[0]?.value || null,
    getGoogleMultiValues: c =>
      c.emails.map(e => ({ value: e.value, type: e.type })),
  },
  {
    field: 'phone',
    label: 'Phone',
    getFriendValue: f => f.phone,
    getGoogleValue: c => c.phoneNumbers[0]?.value || null,
    getGoogleMultiValues: c =>
      c.phoneNumbers.map(p => ({ value: p.value, type: p.type })),
  },
  {
    field: 'address',
    label: 'Address',
    getFriendValue: f => f.address,
    getGoogleValue: c => c.addresses[0]?.formattedValue || null,
    getGoogleMultiValues: c =>
      c.addresses
        .filter(a => a.formattedValue)
        .map(a => ({ value: a.formattedValue!, type: a.type })),
  },
  {
    field: 'birthday',
    label: 'Birthday',
    getFriendValue: f => f.birthday,
    getGoogleValue: c => {
      const bday = c.birthdays?.[0]?.date
      if (!bday?.month || !bday?.day) return null
      const y = bday.year ? String(bday.year).padStart(4, '0') : '0000'
      const m = String(bday.month).padStart(2, '0')
      const d = String(bday.day).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
  },
  {
    field: 'employer',
    label: 'Employer',
    getFriendValue: f => f.employer,
    getGoogleValue: c => c.organizations?.[0]?.name || null,
  },
  {
    field: 'occupation',
    label: 'Occupation',
    getFriendValue: f => f.occupation,
    getGoogleValue: c => c.organizations?.[0]?.title || null,
  },
]

type FriendRow = {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  birthday: string | null
  employer: string | null
  occupation: string | null
  photo: string | null
  googleContactResourceName: string | null
  googleContactEtag: string | null
}

/**
 * Compute field-by-field diffs between a friend and their linked Google contact.
 */
export function computeFieldDiffs(
  friendRow: FriendRow,
  googleContact: GoogleContact,
): FieldDiff[] {
  const diffs: FieldDiff[] = []

  for (const field of SYNCABLE_FIELDS) {
    const appValue = field.getFriendValue(friendRow)
    const googleValue = field.getGoogleValue(googleContact)
    const googleMulti = field.getGoogleMultiValues?.(googleContact)

    // Normalize empty strings to null for comparison
    const normApp = appValue?.trim() || null
    const normGoogle = googleValue?.trim() || null

    if (normApp !== normGoogle) {
      diffs.push({
        field: field.field,
        label: field.label,
        appValue: normApp,
        googleValue: normGoogle,
        googleValues:
          googleMulti && googleMulti.length > 1 ? googleMulti : undefined,
      })
    }
  }

  return diffs
}

/**
 * Sync a linked friend with their Google Contact.
 * Checks etag for changes, computes diffs, downloads photo if changed.
 *
 * Pass `forceCompare: true` to skip the etag check and always compute
 * field diffs. This is needed on initial link where the etag was just
 * stored but the friend's fields haven't been compared yet.
 */
export async function syncLinkedFriend(
  userId: string,
  friendId: string,
  options?: { forceCompare?: boolean },
): Promise<SyncResult> {
  const friendRow = db
    .select({
      name: friend.name,
      email: friend.email,
      phone: friend.phone,
      address: friend.address,
      birthday: friend.birthday,
      employer: friend.employer,
      occupation: friend.occupation,
      photo: friend.photo,
      googleContactResourceName: friend.googleContactResourceName,
      googleContactEtag: friend.googleContactEtag,
    })
    .from(friend)
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .get()

  if (!friendRow?.googleContactResourceName) {
    return {
      status: 'error',
      message: 'Friend is not linked to a Google contact',
    }
  }

  // Fetch the latest data from Google
  const googleContact = await fetchGoogleContact(
    userId,
    friendRow.googleContactResourceName,
  )

  // Contact deleted on Google's side → auto-unlink
  if (!googleContact) {
    unlinkFriendFromGoogleContact(friendId, userId)
    return {
      status: 'unlinked',
      reason: 'google-contact-deleted',
      message: 'The Google contact was deleted. The link has been removed.',
    }
  }

  // Update the cached version too
  upsertCachedContact(userId, googleContact)

  // Check if etag changed (quick change detection)
  // Skip this check on initial link (forceCompare) since the etag was
  // just stored but we still need to compare field values
  if (
    !options?.forceCompare &&
    googleContact.etag === friendRow.googleContactEtag
  ) {
    // No changes — just update the sync timestamp
    db.update(friend)
      .set({ lastGoogleSyncAt: new Date().toISOString() })
      .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
      .run()

    return { status: 'up-to-date' }
  }

  // Etag changed — compute field diffs
  const diffs = computeFieldDiffs(friendRow, googleContact)

  // Check for photo changes
  const googlePhoto = googleContact.photos.find(p => !p.default)
  if (googlePhoto?.url && googlePhoto.url !== friendRow.photo) {
    const photoBytes = await downloadContactPhoto(userId, googlePhoto.url)
    if (photoBytes) {
      // Delete old photo if it exists
      if (friendRow.photo) {
        // Handle both legacy "/api/photos/file.jpg" and plain "file.jpg"
        const oldFilename = friendRow.photo.replace(/^\/api\/photos\//, '')
        deletePhoto(oldFilename)
      }

      const filename = savePhoto(friendId, photoBytes)
      db.update(friend)
        .set({ photo: filename })
        .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
        .run()
    }
  }

  // Update etag and sync timestamp regardless of diffs
  db.update(friend)
    .set({
      googleContactEtag: googleContact.etag,
      lastGoogleSyncAt: new Date().toISOString(),
    })
    .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
    .run()

  if (diffs.length === 0) {
    return { status: 'up-to-date' }
  }

  return { status: 'changes-detected', diffs }
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Clear all Google contact data for a user.
 * Called when the user disconnects Google from their profile.
 */
export function clearGoogleContactData(userId: string) {
  // Clear google columns from all friends
  db.update(friend)
    .set({
      googleContactResourceName: null,
      googleContactEtag: null,
      lastGoogleSyncAt: null,
    })
    .where(
      and(
        eq(friend.userId, userId),
        isNotNull(friend.googleContactResourceName),
      ),
    )
    .run()

  // Delete all cached contacts
  db.delete(googleContactCache)
    .where(eq(googleContactCache.userId, userId))
    .run()

  // Delete sync settings
  db.delete(userGoogleSync).where(eq(userGoogleSync.userId, userId)).run()
}

/**
 * Apply diff resolutions from the user.
 * Updates the friend record with the chosen values.
 */
export function applyDiffResolutions(
  friendId: string,
  userId: string,
  resolutions: Array<{
    field: string
    action: 'use-google' | 'keep-app' | 'push-to-google' | 'skip'
    value?: string
  }>,
) {
  const updates: Record<string, string | null> = {}

  for (const resolution of resolutions) {
    if (resolution.action === 'use-google' && resolution.value !== undefined) {
      updates[resolution.field] = resolution.value || null
    }
    // 'keep-app', 'push-to-google', and 'skip' don't change the local record
  }

  if (Object.keys(updates).length > 0) {
    db.update(friend)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(friend.id, friendId), eq(friend.userId, userId)))
      .run()
  }
}
