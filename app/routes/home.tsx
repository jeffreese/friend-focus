import { and, count, desc, eq, gte, or } from 'drizzle-orm'
import {
  ArrowRight,
  BookOpen,
  Cake,
  CalendarDays,
  Heart,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'
import { CareModeBadge } from '~/components/care-mode-indicator'
import { Avatar } from '~/components/ui/avatar'
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
          className="rounded-xl border border-border-light bg-card p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{friendCount}</p>
              <p className="text-xs text-muted-foreground">Friends</p>
            </div>
          </div>
        </Link>
        <Link
          to="/events"
          className="rounded-xl border border-border-light bg-card p-4 hover:border-accent-teal/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-teal-light/30 text-accent-teal">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingEventCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </div>
        </Link>
        <div className="rounded-xl border border-border-light bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-500">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{careModeCount}</p>
              <p className="text-xs text-muted-foreground">In Care Mode</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border-light bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-500">
              <Cake size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{birthdayCount}</p>
              <p className="text-xs text-muted-foreground">
                Upcoming Birthdays
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays size={18} className="text-accent-teal" />
                Upcoming Events
              </h3>
              <Link
                to="/events"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays
                  size={24}
                  className="mx-auto text-foreground-light mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No upcoming events.
                </p>
                <Link
                  to="/events/new"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Plan one
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(evt => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {evt.name}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[evt.status] || ''}`}
                        >
                          {evt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {evt.date && <span>{formatDate(evt.date)}</span>}
                        {evt.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin size={10} /> {evt.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users size={12} />
                        {evt.invitationCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-muted-foreground" />
                Recent Activity
              </h3>
              <Link
                to="/journal"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen
                  size={24}
                  className="mx-auto text-foreground-light mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No journal entries yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                  >
                    <div className="shrink-0 mt-0.5">
                      <BookOpen size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate">{n.content}</p>
                        <span className="text-[10px] text-foreground-light shrink-0">
                          {n.createdAt ? formatRelativeDate(n.createdAt) : ''}
                        </span>
                      </div>
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
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                Care Mode
              </h3>
            </div>
            {careModeFriends.length === 0 ? (
              <div className="text-center py-6">
                <Heart
                  size={24}
                  className="mx-auto text-foreground-light mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No friends in care mode.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {careModeFriends.map(f => {
                  return (
                    <Link
                      key={f.id}
                      to={`/friends/${f.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                    >
                      <Avatar
                        name={f.name}
                        size="xs"
                        className="bg-pink-100 text-pink-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {f.name}
                          </p>
                          <CareModeBadge />
                        </div>
                        {f.careModeNote && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {f.careModeNote}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-foreground-light">
                          {f.careModeReminder && (
                            <span>
                              {REMINDER_LABELS[f.careModeReminder] ||
                                f.careModeReminder}
                            </span>
                          )}
                          {f.careModeStartedAt && (
                            <span>Since {formatDate(f.careModeStartedAt)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Upcoming Birthdays */}
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Cake size={18} className="text-amber-500" />
                Upcoming Birthdays
              </h3>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-6">
                <Cake
                  size={24}
                  className="mx-auto text-foreground-light mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No upcoming birthdays in the next 30 days.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBirthdays.map(b => (
                  <Link
                    key={b.id}
                    to={`/friends/${b.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                        <Cake size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBirthday(b.birthday)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.daysUntil === 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-accent text-muted-foreground'
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
          <section className="rounded-xl border border-border-light bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Recently Added
              </h3>
              <Link
                to="/friends"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {recentFriends.length === 0 ? (
              <div className="text-center py-6">
                <Users
                  size={24}
                  className="mx-auto text-foreground-light mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No friends yet. Add your first friend!
                </p>
                <Link
                  to="/friends/new"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Add Friend
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentFriends.map(f => (
                  <Link
                    key={f.id}
                    to={`/friends/${f.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={f.name} size="xs" />
                      <div>
                        <p className="text-sm font-medium">{f.name}</p>
                        {f.location && (
                          <p className="text-xs text-muted-foreground">
                            {f.location}
                          </p>
                        )}
                      </div>
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
