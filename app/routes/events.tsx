import {
  Calendar,
  CalendarDays,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { FilterPill } from '~/components/ui/filter-pills'
import { PageHeader } from '~/components/ui/page-header'
import { StatusBadge } from '~/components/ui/status-badge'
import { APP_NAME } from '~/config'
import { getEvents } from '~/lib/event.server'
import { formatDate } from '~/lib/format'
import { EVENT_VIBE_LABELS } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/events'

export function meta() {
  return [{ title: `Events — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || undefined
  const events = getEvents(session.user.id, status)
  return { events }
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { events } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Events">
        <Button asChild>
          <Link to="/events/new">
            <Plus size={16} className="mr-2" />
            New Event
          </Link>
        </Button>
      </PageHeader>

      {/* Status filters */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { label: 'All', value: '' },
          { label: 'Planning', value: 'planning' },
          { label: 'Completed', value: 'completed' },
        ].map(f => (
          <FilterPill
            key={f.value}
            active={currentStatus === f.value}
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              if (f.value) params.set('status', f.value)
              else params.delete('status')
              setSearchParams(params, { replace: true })
            }}
          >
            {f.label}
          </FilterPill>
        ))}
      </div>

      {/* Event cards */}
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Create your first event to start planning gatherings with friends."
          action={
            <Button asChild>
              <Link to="/events/new">
                <Plus size={16} className="mr-2" />
                New Event
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {events.map(evt => (
            <Link
              key={evt.id}
              to={`/events/${evt.id}`}
              className="block rounded-xl border border-border-light bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {evt.name}
                    </h3>
                    <StatusBadge status={evt.status} />
                    {evt.vibe && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {EVENT_VIBE_LABELS[evt.vibe] || evt.vibe}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {evt.activityName && (
                      <span className="flex items-center gap-1">
                        <Sparkles size={14} /> {evt.activityName}
                      </span>
                    )}
                    {evt.date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} /> {formatDate(evt.date)}
                      </span>
                    )}
                    {evt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {evt.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users size={14} />
                    <span>
                      {evt.invitationCount}
                      {evt.capacity ? `/${evt.capacity}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
