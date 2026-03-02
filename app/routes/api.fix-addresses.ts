import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { friend, googleContactCache } from '~/db/schema'

function flattenAddress(value: string | undefined | null): string | null {
  if (!value) return null
  return value.replace(/\n+/g, ', ').trim() || null
}

export function loader() {
  // Find all friends linked to a Google contact that have an address
  const rows = db
    .select({
      id: friend.id,
      name: friend.name,
      address: friend.address,
      resourceName: friend.googleContactResourceName,
    })
    .from(friend)
    .where(
      and(
        isNotNull(friend.address),
        isNotNull(friend.googleContactResourceName),
      ),
    )
    .all()

  const results: Array<{
    name: string
    before: string
    after: string
    source: string
  }> = []

  for (const row of rows) {
    // Get the correct address from the cached Google contact raw JSON
    const cached = db
      .select({ rawJson: googleContactCache.rawJson })
      .from(googleContactCache)
      .where(eq(googleContactCache.resourceName, row.resourceName!))
      .get()

    let correctAddress: string | null = null

    if (cached?.rawJson) {
      try {
        const data = JSON.parse(cached.rawJson)
        correctAddress = flattenAddress(data.addresses?.[0]?.formattedValue)
      } catch {
        // ignore parse errors
      }
    }

    if (correctAddress && correctAddress !== row.address) {
      db.update(friend)
        .set({ address: correctAddress })
        .where(eq(friend.id, row.id))
        .run()
      results.push({
        name: row.name,
        before: row.address!,
        after: correctAddress,
        source: 'google-cache',
      })
    }
  }

  return Response.json({
    message: `Fixed ${results.length} addresses`,
    fixed: results.length,
    results,
  })
}
