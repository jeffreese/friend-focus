import { Plus, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CareModeBadge } from '~/components/care-mode-indicator'
import { Avatar } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { FilterPill } from '~/components/ui/filter-pills'
import { PageHeader } from '~/components/ui/page-header'
import { SearchInput } from '~/components/ui/search-input'
import { Select } from '~/components/ui/select'
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
  const [searchValue, setSearchValue] = useState(currentSearch)

  // Debounce search param updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        updateParams({ search: searchValue })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

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
      <PageHeader title="Friends">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/interests/wizard">
              <Sparkles size={16} className="mr-2" />
              Interest Wizard
            </Link>
          </Button>
          <Button asChild>
            <Link to="/friends/new">
              <Plus size={16} className="mr-2" />
              Add Friend
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Search and sort */}
      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          className="flex-1"
          value={searchValue}
          placeholder="Search friends..."
          onChange={e => setSearchValue(e.target.value)}
        />
        <Select
          className="w-auto"
          value={currentSort}
          onChange={e => updateParams({ sort: e.target.value })}
        >
          <option value="closeness">Sort: Closeness</option>
          <option value="name">Sort: Name</option>
          <option value="createdAt">Sort: Recently Added</option>
        </Select>
      </div>

      {/* Tier filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Tiers:</span>
        <FilterPill
          active={!currentTier}
          onClick={() => updateParams({ tier: '' })}
        >
          All ({totalFriends})
        </FilterPill>
        {tiers.map(tier => (
          <FilterPill
            key={tier.id}
            active={currentTier === tier.id}
            onClick={() =>
              updateParams({
                tier: currentTier === tier.id ? '' : tier.id,
              })
            }
            className={currentTier === tier.id ? 'text-white' : ''}
            style={
              currentTier === tier.id && tier.color
                ? { backgroundColor: tier.color }
                : undefined
            }
          >
            {tier.label} ({tier.friendCount})
          </FilterPill>
        ))}
      </div>

      {/* Friend cards */}
      {friends.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            currentSearch || currentTier
              ? 'No friends match your filters'
              : 'No friends yet'
          }
          description={
            currentSearch || currentTier
              ? undefined
              : 'Add your first friend to get started!'
          }
          action={
            !currentSearch && !currentTier ? (
              <Button asChild>
                <Link to="/friends/new">
                  <Plus size={16} className="mr-2" />
                  Add Friend
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map(f => {
            return (
              <Link
                key={f.id}
                to={`/friends/${f.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={f.name} color={f.tierColor || undefined} />
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
