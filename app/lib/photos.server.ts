import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PHOTOS_DIR =
  process.env.NODE_ENV === 'production'
    ? '/data/photos'
    : join(process.cwd(), 'data', 'photos')

/**
 * Ensure the photos directory exists on disk.
 */
export function ensurePhotosDir(): void {
  if (!existsSync(PHOTOS_DIR)) {
    mkdirSync(PHOTOS_DIR, { recursive: true })
  }
}

/**
 * Save photo bytes to disk. Returns the filename.
 */
export function savePhoto(friendId: string, photoBytes: Buffer): string {
  ensurePhotosDir()
  const filename = `${friendId}.jpg`
  const filePath = join(PHOTOS_DIR, filename)
  writeFileSync(filePath, photoBytes)
  return filename
}

/**
 * Delete a photo file from disk.
 */
export function deletePhoto(filename: string): void {
  const filePath = join(PHOTOS_DIR, filename)
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  } catch {
    // Silently ignore deletion errors
  }
}

/**
 * Check if a photo file exists on disk.
 */
export function photoExists(filename: string): boolean {
  return existsSync(join(PHOTOS_DIR, filename))
}

/**
 * Get the full filesystem path for a photo filename.
 */
export function getPhotoPath(filename: string): string {
  return join(PHOTOS_DIR, filename)
}
