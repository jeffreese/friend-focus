import { and, count, desc, eq, gte, or } from 'drizzle-orm'
import { Cake, Calendar, Heart, Notebook, Plus, Users } from 'lucide-react'
import { Link } from 'react-router'
import { CareModeBadge } from '~/components/care-mode-indicator'
import { Button } from '~/components/ui/button'
import { APP_NAME } from '~/config'
import { db } from '~/db/index.server'
import {
  activity,
  closenessTier,
  event,
  eventInvitation,
  friend,
  note,
} from '~/db/schema'
import {
  computeUpcomingBirthdays,
  formatBirthday,
  formatDate,
  formatRelativeDate,
} from '~/lib/format'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/home'

export function meta() {
  return [
    { title: APP_NAME },
    {
      name: 'description',
      content: `${APP_NAME} — your personal friendship CRM.`,
    },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const today = new Date().toISOString().split('T')[0]

  const friendCount =
    db
      .select({ count: count() })
      .from(friend)
      .where(eq(friend.userId, userId))
      .get()?.count ?? 0

  const upcomingEventCount =
    db
      .select({ count: count() })
      .from(event)
      .where(
        and(
          eq(event.userId, userId),
          or(eq(event.status, 'planning'), eq(event.status, 'finalized')),
          gte(event.date, today),
        ),
      )
      .get()?.count ?? 0

  const careModeCount =
    db
      .select({ count: count() })
      .from(friend)
      .where(and(eq(friend.userId, userId), eq(friend.careModeActive, true)))
      .get()?.count ?? 0

  const recentFriends = db
    .select({
      id: friend.id,
      name: friend.name,
      location: friend.location,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(eq(friend.userId, userId))
    .orderBy(desc(friend.createdAt))
    .limit(5)
    .all()

  const upcomingEvents = db
    .select({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      status: event.status,
      activityName: activity.name,
      invitationCount: count(eventInvitation.id),
    })
    .from(event)
    .leftJoin(activity, eq(event.activityId, activity.id))
    .leftJoin(eventInvitation, eq(eventInvitation.eventId, event.id))
    .where(
      and(
        eq(event.userId, userId),
        or(eq(event.status, 'planning'), eq(event.status, 'finalized')),
        gte(event.date, today),
      ),
    )
    .groupBy(event.id)
    .orderBy(event.date)
    .limit(5)
    .all()

  const careModeFriends = db
    .select({
      id: friend.id,
      name: friend.name,
      careModeNote: friend.careModeNote,
      careModeReminder: friend.careModeReminder,
      careModeStartedAt: friend.careModeStartedAt,
      tierLabel: closenessTier.label,
      tierColor: closenessTier.color,
    })
    .from(friend)
    .leftJoin(closenessTier, eq(friend.closenessTierId, closenessTier.id))
    .where(and(eq(friend.userId, userId), eq(friend.careModeActive, true)))
    .limit(5)
    .all()

  const allFriendsWithBirthdays = db
    .select({
      id: friend.id,
      name: friend.name,
      birthday: friend.birthday,
    })
    .from(friend)
    .where(eq(friend.userId, userId))
    .all()

  const upcomingBirthdays = computeUpcomingBirthdays(allFriendsWithBirthdays)

  const recentNotes = db
    .select({
      id: note.id,
      content: note.content,
      type: note.type,
      friendId: note.friendId,
      eventId: note.eventId,
      createdAt: note.createdAt,
    })
    .from(note)
    .where(eq(note.userId, userId))
    .orderBy(desc(note.createdAt))
    .limit(5)
    .all()

  return {
    friendCount,
    upcomingEventCount,
    careModeCount,
    birthdayCount: upcomingBirthdays.length,
    recentFriends,
    upcomingEvents,
    careModeFriends,
    upcomingBirthdays,
    recentNotes,
  }
}

const statusColors: Record<string, string> = {
  planning: 'bg-warning/10 text-warning',
  finalized: 'bg-primary/10 text-primary',
}

const REMINDER_LABELS: Record<string, string> = {
  daily: 'Daily',
  every_3_days: 'Every 3 days',
  weekly: 'Weekly',
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    friendCount,
    upcomingEventCount,
    careModeCount,
    birthdayCount,
    recentFriends,
    upcomingEvents,
    careModeFriends,
    upcomingBirthdays,
    recentNotes,
  } = loaderData

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button asChild>
          <Link to="/friends/new">
            <Plus size={16} className="mr-2" />
            Add Friend
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/friends"
          className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors"
        >
          <Users size={20} className="text-primary mb-2" />
          <p className="text-2xl font-bold">{friendCount}</p>
          <p className="text-xs text-muted-foreground">Friends</p>
        </Link>
        <Link
          to="/events"
          className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors"
        >
          <Calendar size={20} className="text-primary mb-2" />
          <p className="text-2xl font-bold">{upcomingEventCount}</p>
          <p className="text-xs text-muted-foreground">Upcoming Events</p>
        </Link>
        <div className="rounded-xl border bg-card p-4">
          <Heart size={20} className="text-pink-500 mb-2" />
          <p className="text-2xl font-bold">{careModeCount}</p>
          <p className="text-xs text-muted-foreground">In Care Mode</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Cake size={20} className="text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{birthdayCount}</p>
          <p className="text-xs text-muted-foreground">Upcoming Birthdays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Upcoming Events</h3>
              <Link
                to="/events"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(evt => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.id}`}
                    className="flex items-center justify-between py-2 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{evt.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {evt.date && <span>{formatDate(evt.date)}</span>}
                        {evt.location && <span>{evt.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusColors[evt.status] || ''}`}
                      >
                        {evt.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {evt.invitationCount} invited
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Activity</h3>
              <Link
                to="/journal"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent activity.
              </p>
            ) : (
              <div className="space-y-2">
                {recentNotes.map(n => (
                  <div key={n.id} className="flex items-start gap-2 py-1.5">
                    <Notebook
                      size={14}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{n.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {n.createdAt ? formatRelativeDate(n.createdAt) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Care Mode */}
          {careModeFriends.length > 0 && (
            <section className="rounded-xl border border-pink-200 bg-pink-50 p-5">
              <h3 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                <Heart size={16} className="fill-current" />
                Care Mode
              </h3>
              <div className="space-y-2">
                {careModeFriends.map(f => (
                  <Link
                    key={f.id}
                    to={`/friends/${f.id}`}
                    className="flex items-center justify-between py-1.5 hover:bg-pink-100/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-pink-800">
                        {f.name}
                      </span>
                      {f.careModeNote && (
                        <p className="text-xs text-pink-600 truncate max-w-[200px]">
                          {f.careModeNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {f.careModeReminder && (
                        <span className="text-[10px] text-pink-500">
                          {REMINDER_LABELS[f.careModeReminder] ||
                            f.careModeReminder}
                        </span>
                      )}
                      <CareModeBadge />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Birthdays */}
          <section className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Cake size={16} className="text-amber-500" />
              Upcoming Birthdays
            </h3>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No birthdays in the next 30 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingBirthdays.map(b => (
                  <Link
                    key={b.id}
                    to={`/friends/${b.id}`}
                    className="flex items-center justify-between py-1.5 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{b.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatBirthday(b.birthday)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.daysUntil === 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {b.daysUntil === 0 ? 'Today!' : `in ${b.daysUntil}d`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recently Added Friends */}
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recently Added</h3>
              <Link
                to="/friends"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {recentFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No friends yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentFriends.map(f => (
                  <Link
                    key={f.id}
                    to={`/friends/${f.id}`}
                    className="flex items-center gap-3 py-1.5 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {f.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{f.name}</span>
                      {f.location && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {f.location}
                        </span>
                      )}
                    </div>
                    {f.tierLabel && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                        style={{
                          backgroundColor: f.tierColor || '#6b7280',
                        }}
                      >
                        {f.tierLabel}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
