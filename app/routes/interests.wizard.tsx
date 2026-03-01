import { parseWithZod } from '@conform-to/zod/v4'
import { ArrowUp, Sparkles, Users } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { FilterPill } from '~/components/ui/filter-pills'
import { PageHeader } from '~/components/ui/page-header'
import { Select } from '~/components/ui/select'
import { WizardRatingRow } from '~/components/wizard-rating-row'
import { APP_NAME } from '~/config'
import { getActivities, getActivity } from '~/lib/activity.server'
import { getClosenessTiers } from '~/lib/closeness.server'
import { getFriend, getFriends } from '~/lib/friend.server'
import {
  deleteFriendActivity,
  getAllFriendActivityRatings,
  upsertFriendActivity,
} from '~/lib/friend-activity.server'
import { wizardRatingSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/interests.wizard'

export function meta() {
  return [{ title: `Interest Wizard — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const activities = getActivities(userId)
  const friends = getFriends({ userId, sortBy: 'closeness' })
  const tiers = getClosenessTiers(userId)
  const allRatings = getAllFriendActivityRatings(userId)

  return { activities, friends, tiers, allRatings }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: wizardRatingSchema })

  if (submission.status !== 'success') {
    return { ok: false }
  }

  const { intent, friendId, activityId, rating } = submission.value

  // Verify ownership
  const f = getFriend(friendId, userId)
  if (!f) return { ok: false }
  const a = getActivity(activityId, userId)
  if (!a) return { ok: false }

  if (intent === 'set-rating' && rating) {
    upsertFriendActivity(friendId, activityId, rating)
  } else if (intent === 'clear-rating') {
    deleteFriendActivity(friendId, activityId)
  }

  return { ok: true }
}

export default function InterestWizard({ loaderData }: Route.ComponentProps) {
  const { activities, friends, tiers, allRatings } = loaderData
  const [selectedActivityId, setSelectedActivityId] = useState(
    activities[0]?.id ?? '',
  )
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Build ratings map: activityId -> friendId -> rating
  const ratingsMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const r of allRatings) {
      if (!map.has(r.activityId)) map.set(r.activityId, new Map())
      map.get(r.activityId)!.set(r.friendId, r.rating)
    }
    return map
  }, [allRatings])

  if (activities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <BackLink to="/settings">Settings</BackLink>
        <PageHeader title="Interest Wizard" />
        <EmptyState
          icon={Sparkles}
          title="No Activities"
          description="Create some activities in Settings before using the wizard."
          action={
            <Button asChild>
              <Link to="/settings">Go to Settings</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <BackLink to="/friends">Friends</BackLink>
        <PageHeader title="Interest Wizard" />
        <EmptyState
          icon={Users}
          title="No Friends"
          description="Add some friends before using the interest wizard."
          action={
            <Button asChild>
              <Link to="/friends/new">Add Friend</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const currentActivity =
    activities.find(a => a.id === selectedActivityId) ?? activities[0]
  const filteredFriends = tierFilter
    ? friends.filter(f => f.closenessTierId === tierFilter)
    : friends
  const activityRatings = ratingsMap.get(currentActivity.id)

  // Count how many friends have a rating for the current activity
  const ratedCount = activityRatings?.size ?? 0

  return (
    <div className="max-w-3xl mx-auto">
      <BackLink to="/friends">Friends</BackLink>
      <PageHeader title="Interest Wizard" />

      {/* Activity selector */}
      <div ref={topRef} className="mb-6">
        <label
          htmlFor="activity-select"
          className="block text-sm font-medium mb-1.5"
        >
          Activity
        </label>
        <Select
          id="activity-select"
          value={selectedActivityId}
          onChange={e => setSelectedActivityId(e.target.value)}
        >
          {activities.map(activity => {
            const rated = ratingsMap.get(activity.id)?.size ?? 0
            return (
              <option key={activity.id} value={activity.id}>
                {activity.name} ({rated} rated)
              </option>
            )
          })}
        </Select>
        <p className="text-sm text-muted-foreground mt-1.5">
          Rate how much each friend enjoys this activity
        </p>
      </div>

      {/* Tier filter pills */}
      {tiers.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <FilterPill
            active={tierFilter === null}
            onClick={() => setTierFilter(null)}
          >
            All ({friends.length})
          </FilterPill>
          {tiers.map(tier => {
            const count = friends.filter(
              f => f.closenessTierId === tier.id,
            ).length
            if (count === 0) return null
            return (
              <FilterPill
                key={tier.id}
                active={tierFilter === tier.id}
                onClick={() => setTierFilter(tier.id)}
              >
                {tier.label} ({count})
              </FilterPill>
            )
          })}
        </div>
      )}

      {/* Rated count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>
          {filteredFriends.length} friend
          {filteredFriends.length !== 1 ? 's' : ''}
        </span>
        <span>{ratedCount} rated</span>
      </div>

      {/* Friend rating rows */}
      <div className="space-y-2 mb-6">
        {filteredFriends.map(friend => (
          <WizardRatingRow
            key={friend.id}
            friend={{
              id: friend.id,
              name: friend.name,
              tierLabel: friend.tierLabel,
              tierColor: friend.tierColor,
            }}
            activityId={currentActivity.id}
            currentRating={activityRatings?.get(friend.id) ?? null}
          />
        ))}
        {filteredFriends.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No friends in this tier.
          </p>
        )}
      </div>

      {/* Back to top */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ArrowUp className="size-4 mr-1" />
          Back to top
        </Button>
      </div>
    </div>
  )
}
