import { redirect } from 'react-router'
import { deleteFriend, getFriend } from '~/lib/friend.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends.$id.delete'

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const friend = getFriend(params.id, userId)
  if (!friend) {
    return redirect('/friends')
  }

  deleteFriend(params.id, userId)

  return redirect('/friends')
}
