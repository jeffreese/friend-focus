import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowLeft } from 'lucide-react'
import { Link, redirect, useActionData } from 'react-router'
import { FriendForm } from '~/components/friend-form'
import { APP_NAME } from '~/config'
import { getActivities } from '~/lib/activity.server'
import { getClosenessTiers } from '~/lib/closeness.server'
import { createFriend } from '~/lib/friend.server'
import { bulkUpsertFriendActivities } from '~/lib/friend-activity.server'
import { friendSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends.new'

export function meta() {
  return [{ title: `Add Friend — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const [tiers, activities] = [getClosenessTiers(userId), getActivities(userId)]
  return { tiers, activities }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: friendSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const data = { ...submission.value }

  // Handle care mode timestamps
  if (data.careModeActive) {
    data.careModeStartedAt = new Date().toISOString().split('T')[0]
  } else {
    data.careModeNote = undefined
    data.careModeReminder = undefined
    data.careModeStartedAt = undefined
  }

  const friend = createFriend(data, userId)

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
  if (ratings.length > 0) {
    bulkUpsertFriendActivities(friend.id, ratings)
  }

  return redirect(`/friends/${friend.id}`)
}

export default function FriendNew({ loaderData }: Route.ComponentProps) {
  const { tiers, activities } = loaderData
  const lastResult = useActionData<typeof action>()

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/friends"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Friends
      </Link>

      <h2 className="text-2xl font-bold mb-6">Add Friend</h2>

      <div className="rounded-xl border bg-card p-6">
        <FriendForm
          tiers={tiers}
          activities={activities}
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
