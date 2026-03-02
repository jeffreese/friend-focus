import { redirect } from 'react-router'
import { deleteFriend, getFriend } from '~/lib/friend.server'
import {
  deleteGoogleContact,
  hasContactsWriteScope,
} from '~/lib/google-contacts.server'
import { deletePhoto, photoExists } from '~/lib/photos.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends.$id.delete'

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const friend = getFriend(params.id, userId)
  if (!friend) {
    return redirect('/friends')
  }

  // Optionally delete from Google Contacts
  const formData = await request.formData()
  const shouldDeleteFromGoogle = formData.get('deleteFromGoogle') === 'true'

  if (
    shouldDeleteFromGoogle &&
    friend.googleContactResourceName &&
    hasContactsWriteScope(userId)
  ) {
    try {
      await deleteGoogleContact(userId, friend.googleContactResourceName)
    } catch {
      // Swallow Google errors — local delete always succeeds
    }
  }

  // Clean up any locally stored photo
  if (friend.photo) {
    const filename = friend.photo.replace(/^.*\//, '')
    if (filename && photoExists(filename)) {
      deletePhoto(filename)
    }
  }

  deleteFriend(params.id, userId)

  return redirect('/friends')
}
