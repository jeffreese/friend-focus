import { sql } from 'drizzle-orm'
import { db } from '~/db/index.server'

export function loader() {
  try {
    db.run(sql`SELECT 1`)
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 },
    )
  }
}
