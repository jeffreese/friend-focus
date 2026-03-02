import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// ─── Auth tables (better-auth) ───────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// ─── Closeness Tiers ─────────────────────────────────────────────────────────

export const closenessTier = sqliteTable(
  'closeness_tier',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull(),
    color: text('color'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [
    uniqueIndex('closeness_tier_user_sort').on(table.userId, table.sortOrder),
  ],
)

// ─── Friends ─────────────────────────────────────────────────────────────────

export const friend = sqliteTable('friend', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  photo: text('photo'),
  phone: text('phone'),
  email: text('email'),
  socialHandles: text('social_handles'),
  birthday: text('birthday'),
  address: text('address'),
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  addressZip: text('address_zip'),
  addressCountry: text('address_country'),
  addressLat: text('address_lat'),
  addressLng: text('address_lng'),
  addressPlaceId: text('address_place_id'),
  loveLanguage: text('love_language'),
  favoriteFood: text('favorite_food'),
  dietaryRestrictions: text('dietary_restrictions'),
  employer: text('employer'),
  occupation: text('occupation'),
  personalNotes: text('personal_notes'),
  careModeActive: integer('care_mode_active', { mode: 'boolean' })
    .notNull()
    .default(false),
  careModeNote: text('care_mode_note'),
  careModeReminder: text('care_mode_reminder'),
  careModeStartedAt: text('care_mode_started_at'),
  closenessTierId: text('closeness_tier_id').references(
    () => closenessTier.id,
    { onDelete: 'set null' },
  ),
  googleContactResourceName: text('google_contact_resource_name'),
  googleContactEtag: text('google_contact_etag'),
  lastGoogleSyncAt: text('last_google_sync_at'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ─── Activities & Interests ──────────────────────────────────────────────────

export const activity = sqliteTable(
  'activity',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    icon: text('icon'),
    isDefault: integer('is_default', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [uniqueIndex('activity_user_name').on(table.userId, table.name)],
)

export const friendActivity = sqliteTable(
  'friend_activity',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    friendId: text('friend_id')
      .notNull()
      .references(() => friend.id, { onDelete: 'cascade' }),
    activityId: text('activity_id')
      .notNull()
      .references(() => activity.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
  },
  table => [
    uniqueIndex('friend_activity_unique').on(table.friendId, table.activityId),
  ],
)

// ─── Availability ────────────────────────────────────────────────────────────

export const availability = sqliteTable('availability', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  friendId: text('friend_id')
    .notNull()
    .references(() => friend.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ─── Friend Connections (Social Graph) ───────────────────────────────────────

export const friendConnection = sqliteTable(
  'friend_connection',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    friendAId: text('friend_a_id')
      .notNull()
      .references(() => friend.id, { onDelete: 'cascade' }),
    friendBId: text('friend_b_id')
      .notNull()
      .references(() => friend.id, { onDelete: 'cascade' }),
    type: text('type'),
    strength: integer('strength').notNull().default(3),
    howTheyMet: text('how_they_met'),
    startDate: text('start_date'),
    endDate: text('end_date'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [
    uniqueIndex('friend_connection_unique').on(
      table.friendAId,
      table.friendBId,
    ),
  ],
)

// ─── Gift Ideas ──────────────────────────────────────────────────────────────

export const giftIdea = sqliteTable('gift_idea', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  friendId: text('friend_id')
    .notNull()
    .references(() => friend.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  url: text('url'),
  price: text('price'),
  purchased: integer('purchased', { mode: 'boolean' }).notNull().default(false),
  purchasedAt: text('purchased_at'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ─── Events ──────────────────────────────────────────────────────────────────

export const event = sqliteTable('event', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  activityId: text('activity_id').references(() => activity.id, {
    onDelete: 'set null',
  }),
  date: text('date'),
  time: text('time'),
  location: text('location'),
  locationStreet: text('location_street'),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  locationZip: text('location_zip'),
  locationCountry: text('location_country'),
  locationLat: text('location_lat'),
  locationLng: text('location_lng'),
  locationPlaceId: text('location_place_id'),
  capacity: integer('capacity'),
  vibe: text('vibe'),
  status: text('status').notNull().default('planning'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  googleCalendarEventId: text('google_calendar_event_id'),
  googleCalendarLink: text('google_calendar_link'),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const eventInvitation = sqliteTable(
  'event_invitation',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    friendId: text('friend_id')
      .notNull()
      .references(() => friend.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('not_invited'),
    attended: integer('attended', { mode: 'boolean' }),
    mustInvite: integer('must_invite', { mode: 'boolean' })
      .notNull()
      .default(false),
    mustExclude: integer('must_exclude', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [
    uniqueIndex('event_invitation_unique').on(table.eventId, table.friendId),
  ],
)

// ─── Google Contacts Cache ──────────────────────────────────────────────────

export const googleContactCache = sqliteTable(
  'google_contact_cache',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    resourceName: text('resource_name').notNull(),
    displayName: text('display_name'),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    photoUrl: text('photo_url'),
    etag: text('etag'),
    rawJson: text('raw_json'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fetchedAt: integer('fetched_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [
    uniqueIndex('google_contact_cache_user_resource').on(
      table.userId,
      table.resourceName,
    ),
  ],
)

// ─── User Google Sync Settings ──────────────────────────────────────────────

export const userGoogleSync = sqliteTable('user_google_sync', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  googleContactsSyncToken: text('google_contacts_sync_token'),
  lastBulkSyncAt: integer('last_bulk_sync_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// ─── Notes / Journal ─────────────────────────────────────────────────────────

export const note = sqliteTable('note', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  type: text('type').notNull(),
  friendId: text('friend_id').references(() => friend.id, {
    onDelete: 'cascade',
  }),
  eventId: text('event_id').references(() => event.id, {
    onDelete: 'cascade',
  }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
