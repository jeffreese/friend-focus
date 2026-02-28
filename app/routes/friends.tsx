import { Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { CareModeBadge } from '~/components/care-mode-indicator'
import { Button } from '~/components/ui/button'
import { APP_NAME } from '~/config'
import { getClosenessTiers } from '~/lib/closeness.server'
import { getFriends } from '~/lib/friend.server'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends'

export function meta() {
  return [{ title: `Friends — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const tierId = url.searchParams.get('tier') || undefined
  const sortBy =
    (url.searchParams.get('sort') as 'name' | 'closeness' | 'createdAt') ||
    'closeness'

  const [friends, tiers] = [
    getFriends({ userId, search, tierId, sortBy }),
    getClosenessTiers(userId),
  ]

  return { friends, tiers }
}

export default function Friends({ loaderData }: Route.ComponentProps) {
  const { friends, tiers } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTier = searchParams.get('tier') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentSort = searchParams.get('sort') || 'closeness'

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    setSearchParams(params, { replace: true })
  }

  const totalFriends = tiers.reduce((sum, t) => sum + t.friendCount, 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Friends</h2>
        <Button asChild>
          <Link to="/friends/new">
            <Plus size={16} className="mr-2" />
            Add Friend
          </Link>
        </Button>
      </div>

      {/* Search and sort */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search friends..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            onChange={e => updateParams({ search: e.target.value })}
          />
        </div>
        <select
          value={currentSort}
          onChange={e => updateParams({ sort: e.target.value })}
          className="px-3 py-2.5 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="closeness">Sort: Closeness</option>
          <option value="name">Sort: Name</option>
          <option value="createdAt">Sort: Recently Added</option>
        </select>
      </div>

      {/* Tier filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Tiers:</span>
        <button
          type="button"
          onClick={() => updateParams({ tier: '' })}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            !currentTier
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          All ({totalFriends})
        </button>
        {tiers.map(tier => (
          <button
            type="button"
            key={tier.id}
            onClick={() =>
              updateParams({
                tier: currentTier === tier.id ? '' : tier.id,
              })
            }
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              currentTier === tier.id
                ? 'text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
            style={
              currentTier === tier.id && tier.color
                ? { backgroundColor: tier.color }
                : undefined
            }
          >
            {tier.label} ({tier.friendCount})
          </button>
        ))}
      </div>

      {/* Friend cards */}
      {friends.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {currentSearch || currentTier
              ? 'No friends match your filters.'
              : 'No friends yet. Add your first friend!'}
          </p>
          {!currentSearch && !currentTier && (
            <Button asChild>
              <Link to="/friends/new">
                <Plus size={16} className="mr-2" />
                Add Friend
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map(f => {
            const initials = f.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <Link
                key={f.id}
                to={`/friends/${f.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                      {f.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {f.tierLabel && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          style={{
                            backgroundColor: f.tierColor || '#6b7280',
                          }}
                        >
                          {f.tierLabel}
                        </span>
                      )}
                      {f.careModeActive && <CareModeBadge />}
                      {f.location && (
                        <span className="text-xs text-muted-foreground">
                          {f.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
