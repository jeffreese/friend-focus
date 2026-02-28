import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const url = process.env.DATABASE_URL || 'sqlite.db'
const sqlite = new Database(url)
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite, { schema })

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
})

const defaultTiers = [
  { label: 'Bestie', sortOrder: 1, color: '#c45ea3' },
  { label: 'Close', sortOrder: 2, color: '#8b5fbf' },
  { label: 'Good', sortOrder: 3, color: '#5b7fc7' },
  { label: 'Growing', sortOrder: 4, color: '#4dab8a' },
  { label: 'Casual', sortOrder: 5, color: '#6b9dba' },
  { label: 'Acquaintance', sortOrder: 6, color: '#7a85a0' },
  { label: 'Childhood', sortOrder: 7, color: '#c4952e' },
  { label: 'Moved', sortOrder: 8, color: '#808080' },
  { label: 'Drifted', sortOrder: 9, color: '#a0a0a0' },
  { label: 'Fell Out', sortOrder: 10, color: '#c0392b' },
  { label: 'Passed', sortOrder: 11, color: '#2c3e50' },
]

const defaultActivities = [
  { name: 'Poker', icon: 'Spade', isDefault: true, sortOrder: 0 },
  { name: 'Ocho', icon: 'Circle', isDefault: false, sortOrder: 1 },
  { name: 'Cinema', icon: 'Film', isDefault: true, sortOrder: 2 },
  { name: 'Travel', icon: 'Plane', isDefault: true, sortOrder: 3 },
  { name: 'Backpacking', icon: 'Mountain', isDefault: true, sortOrder: 4 },
  { name: 'Skiing', icon: 'Snowflake', isDefault: true, sortOrder: 5 },
  { name: 'Bands', icon: 'Music', isDefault: true, sortOrder: 6 },
  { name: 'EDM Venues', icon: 'Headphones', isDefault: false, sortOrder: 7 },
  { name: 'Hiking', icon: 'TreePine', isDefault: true, sortOrder: 8 },
  { name: 'Board Games', icon: 'Dice5', isDefault: true, sortOrder: 9 },
  {
    name: 'Dining Out',
    icon: 'UtensilsCrossed',
    isDefault: true,
    sortOrder: 10,
  },
  { name: 'Catsit', icon: 'Cat', isDefault: false, sortOrder: 11 },
]

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (order matters for foreign keys)
  db.delete(schema.note).run()
  db.delete(schema.eventInvitation).run()
  db.delete(schema.event).run()
  db.delete(schema.giftIdea).run()
  db.delete(schema.availability).run()
  db.delete(schema.friendConnection).run()
  db.delete(schema.friendActivity).run()
  db.delete(schema.friend).run()
  db.delete(schema.activity).run()
  db.delete(schema.closenessTier).run()
  db.delete(schema.session).run()
  db.delete(schema.account).run()
  db.delete(schema.verification).run()
  db.delete(schema.user).run()

  // Create test user via better-auth (handles password hashing)
  const result = await auth.api.signUpEmail({
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    },
  })

  if (!result) {
    throw new Error('Failed to create test user')
  }

  const userId = result.user.id

  // Seed closeness tiers
  console.log('Seeding closeness tiers...')
  for (const tier of defaultTiers) {
    db.insert(schema.closenessTier).values({ ...tier, userId }).run()
  }
  console.log(`Seeded ${defaultTiers.length} closeness tiers.`)

  // Seed activities
  console.log('Seeding activities...')
  for (const act of defaultActivities) {
    db.insert(schema.activity).values({ ...act, userId }).run()
  }
  console.log(`Seeded ${defaultActivities.length} activities.`)

  console.log('Created test user:')
  console.log('  Email:    test@example.com')
  console.log('  Password: password123')
  console.log('Seed complete.')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
