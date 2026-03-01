import { parseWithZod } from '@conform-to/zod/v4'
import { redirect, useActionData, useRouteError } from 'react-router'
import { FriendForm } from '~/components/friend-form'
import { BackLink } from '~/components/ui/back-link'
import { ErrorDisplay } from '~/components/ui/error-display'
import { APP_NAME } from '~/config'
import { getActivities } from '~/lib/activity.server'
import { getClosenessTiers } from '~/lib/closeness.server'
import { getFriend, getFriendWithTier, updateFriend } from '~/lib/friend.server'
import {
  bulkUpsertFriendActivities,
  getFriendActivities,
} from '~/lib/friend-activity.server'
import { isPlacesEnabled } from '~/lib/places.server'
import { friendSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends.$id.edit'

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: `Edit ${data?.friend?.name || 'Friend'} — ${APP_NAME}`,
    },
  ]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const friend = getFriendWithTier(params.id, userId)
  if (!friend) {
    throw new Response('Friend not found', { status: 404 })
  }

  const tiers = getClosenessTiers(userId)
  const activities = getActivities(userId)
  const activityRatings = getFriendActivities(params.id)

  return {
    friend,
    tiers,
    activities,
    activityRatings,
    placesEnabled: isPlacesEnabled(),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: friendSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const data = { ...submission.value }

  // Handle careModeStartedAt transitions
  const existingFriend = getFriend(params.id, userId)
  if (data.careModeActive && !existingFriend?.careModeActive) {
    data.careModeStartedAt = new Date().toISOString().split('T')[0]
  } else if (!data.careModeActive) {
    data.careModeNote = undefined
    data.careModeReminder = undefined
    data.careModeStartedAt = undefined
  }

  updateFriend(params.id, data, userId)

  // Extract activity ratings from form data
  const ratings: Array<{ activityId: string; rating: number }> = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('rating-') && value) {
      const activityId = key.replace('rating-', '')
      const rating = Number.parseInt(String(value), 10)
      if (rating >= 1 && rating <= 5) {
        ratings.push({ activityId, rating })
      }
    }
  }
  bulkUpsertFriendActivities(params.id, ratings)

  return redirect(`/friends/${params.id}`)
}

export default function FriendEdit({ loaderData }: Route.ComponentProps) {
  const { friend, tiers, activities, activityRatings, placesEnabled } =
    loaderData
  const lastResult = useActionData<typeof action>()

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink to={`/friends/${friend.id}`}>Back to {friend.name}</BackLink>

      <h2 className="text-2xl font-bold mb-6">Edit {friend.name}</h2>

      <div className="rounded-xl border border-border-light bg-card p-6">
        <FriendForm
          friend={friend}
          tiers={tiers}
          activities={activities}
          activityRatings={activityRatings}
          placesEnabled={placesEnabled}
          errors={
            lastResult && 'error' in lastResult
              ? (lastResult.error as Record<string, string[]>)
              : undefined
          }
        />
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return <ErrorDisplay error={error} />
}
