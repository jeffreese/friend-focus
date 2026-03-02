import { readFileSync } from 'node:fs'
import { getPhotoPath, photoExists } from '~/lib/photos.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/api.photos.$filename'

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireSession(request)

  const filename = params.filename
  if (!filename || !photoExists(filename)) {
    throw new Response('Not found', { status: 404 })
  }

  // Basic security: prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    throw new Response('Invalid filename', { status: 400 })
  }

  const filePath = getPhotoPath(filename)
  const fileBuffer = readFileSync(filePath)

  const ext = filename.split('.').pop()?.toLowerCase()
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': String(fileBuffer.byteLength),
    },
  })
}
