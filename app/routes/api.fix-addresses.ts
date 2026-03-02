import { like } from 'drizzle-orm'
import { db } from '~/db/index.server'
import { friend } from '~/db/schema'

export async function loader() {
  const rows = db
    .select({ id: friend.id, name: friend.name, address: friend.address })
    .from(friend)
    .where(like(friend.address, '%\n%'))
    .all()

  if (rows.length === 0) {
    return Response.json({
      message: 'No addresses with newlines found',
      fixed: 0,
    })
  }

  const results: Array<{ name: string; before: string; after: string }> = []

  for (const row of rows) {
    const fixed = row.address!.replace(/\n+/g, ', ').trim()
    db.update(friend)
      .set({ address: fixed })
      .where(like(friend.id, row.id))
      .run()
    results.push({ name: row.name, before: row.address!, after: fixed })
  }

  return Response.json({
    message: `Fixed ${results.length} addresses`,
    fixed: results.length,
    results,
  })
}
