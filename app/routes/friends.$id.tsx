import { parseWithZod } from '@conform-to/zod/v4'
import {
  Briefcase,
  Cake,
  Edit,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Trash2,
} from 'lucide-react'
import { Form, Link, useActionData, useRouteError } from 'react-router'
import { ActivityInterestsSummary } from '~/components/activity-interests-summary'
import { CareModeBadge, CareModeBanner } from '~/components/care-mode-indicator'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { ErrorDisplay } from '~/components/ui/error-display'
import { APP_NAME } from '~/config'
import {
  createAvailability,
  deleteAvailability,
} from '~/lib/availability.server'
import { formatBirthday } from '~/lib/format'
import { getFriendDetail, getFriendOptions } from '~/lib/friend.server'
import {
  createConnection,
  deleteConnection,
} from '~/lib/friend-connection.server'
import {
  createGiftIdea,
  deleteGiftIdea,
  toggleGiftPurchased,
} from '~/lib/gift-idea.server'
import { createNote, deleteNote, updateNote } from '~/lib/note.server'
import {
  availabilitySchema,
  friendConnectionSchema,
  giftIdeaSchema,
  noteSchema,
} from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/friends.$id'

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.friend?.name || 'Friend'} — ${APP_NAME}` }]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const friend = getFriendDetail(params.id, userId)
  if (!friend) {
    throw new Response('Friend not found', { status: 404 })
  }

  const allFriends = getFriendOptions(userId)

  return { friend, allFriends }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const intent = formData.get('intent')

  try {
    switch (intent) {
      case 'add-gift': {
        const submission = parseWithZod(formData, {
          schema: giftIdeaSchema,
        })
        if (submission.status !== 'success') {
          return submission.reply()
        }
        createGiftIdea(params.id, submission.value, userId)
        return { ok: true }
      }
      case 'delete-gift': {
        const giftId = formData.get('giftId') as string
        if (giftId) deleteGiftIdea(giftId, userId)
        return { ok: true }
      }
      case 'toggle-gift-purchased': {
        const giftId = formData.get('giftId') as string
        if (giftId) toggleGiftPurchased(giftId, userId)
        return { ok: true }
      }
      case 'add-availability': {
        const submission = parseWithZod(formData, {
          schema: availabilitySchema,
        })
        if (submission.status !== 'success') {
          return submission.reply()
        }
        createAvailability(params.id, submission.value, userId)
        return { ok: true }
      }
      case 'delete-availability': {
        const availabilityId = formData.get('availabilityId') as string
        if (availabilityId) deleteAvailability(availabilityId, userId)
        return { ok: true }
      }
      case 'add-connection': {
        const submission = parseWithZod(formData, {
          schema: friendConnectionSchema,
        })
        if (submission.status !== 'success') {
          return submission.reply()
        }
        createConnection(submission.value, userId)
        return { ok: true }
      }
      case 'delete-connection': {
        const connectionId = formData.get('connectionId') as string
        if (connectionId) deleteConnection(connectionId)
        return { ok: true }
      }
      case 'add-note': {
        const submission = parseWithZod(formData, {
          schema: noteSchema,
        })
        if (submission.status !== 'success') {
          return submission.reply()
        }
        createNote(
          {
            content: submission.value.content,
            type: 'friend',
            friendId: params.id,
          },
          userId,
        )
        return { ok: true }
      }
      case 'update-note': {
        const noteId = formData.get('noteId') as string
        const content = formData.get('content') as string
        if (noteId && content) updateNote(noteId, content, userId)
        return { ok: true }
      }
      case 'delete-note': {
        const noteId = formData.get('noteId') as string
        if (noteId) deleteNote(noteId, userId)
        return { ok: true }
      }
      default:
        return { error: 'Unknown intent' }
    }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export default function FriendDetail({ loaderData }: Route.ComponentProps) {
  const { friend, allFriends } = loaderData
  const actionData = useActionData<typeof action>()

  const initials = friend.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Action error banner */}
      {actionData &&
        'error' in actionData &&
        typeof actionData.error === 'string' && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-destructive-light text-destructive text-sm flex items-center gap-2">
            <MessageSquare size={14} />
            {actionData.error}
          </div>
        )}

      {/* Back link */}
      <BackLink to="/friends">Back to Friends</BackLink>

      {/* Profile header */}
      <div className="rounded-xl border border-border-light bg-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{friend.name}</h2>
                {friend.tierLabel && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                    style={{
                      backgroundColor: friend.tierColor || '#6b7280',
                    }}
                  >
                    {friend.tierLabel}
                  </span>
                )}
                {friend.careModeActive && <CareModeBadge size="md" />}
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                {friend.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {friend.location}
                  </span>
                )}
                {friend.birthday && (
                  <span className="flex items-center gap-1">
                    <Cake size={14} /> {formatBirthday(friend.birthday)}
                  </span>
                )}
                {(friend.occupation || friend.employer) && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />{' '}
                    {[friend.occupation, friend.employer]
                      .filter(Boolean)
                      .join(' at ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                {friend.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {friend.phone}
                  </span>
                )}
                {friend.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {friend.email}
                  </span>
                )}
              </div>
              {(friend.loveLanguage || friend.favoriteFood) && (
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {friend.loveLanguage && (
                    <span>
                      Love Language:{' '}
                      <span className="text-foreground">
                        {friend.loveLanguage}
                      </span>
                    </span>
                  )}
                  {friend.favoriteFood && (
                    <span>
                      Favorite Food:{' '}
                      <span className="text-foreground">
                        {friend.favoriteFood}
                      </span>
                    </span>
                  )}
                </div>
              )}
              {friend.dietaryRestrictions && (
                <p className="text-sm text-muted-foreground mt-1">
                  Dietary:{' '}
                  <span className="text-foreground">
                    {friend.dietaryRestrictions}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/friends/${friend.id}/edit`}>
                <Edit size={14} className="mr-2" />
                Edit
              </Link>
            </Button>
            <Form
              method="post"
              action={`/friends/${friend.id}/delete`}
              onSubmit={e => {
                if (
                  !confirm(
                    `Are you sure you want to delete ${friend.name}? This cannot be undone.`,
                  )
                ) {
                  e.preventDefault()
                }
              }}
            >
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </Button>
            </Form>
          </div>
        </div>

        {/* Personal notes */}
        {friend.personalNotes && (
          <div className="mt-4 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <div className="flex items-center gap-1 text-xs mb-1">
              <MessageSquare size={12} />
              Notes
            </div>
            {friend.personalNotes}
          </div>
        )}

        {/* Care mode banner */}
        {friend.careModeActive && (
          <div className="mt-4">
            <CareModeBanner
              note={friend.careModeNote}
              reminder={friend.careModeReminder}
              startedAt={friend.careModeStartedAt}
            />
          </div>
        )}
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-xl border border-border-light bg-card p-5">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            Activity Interests
          </h3>
          {friend.activityRatings && friend.activityRatings.length > 0 ? (
            <ActivityInterestsSummary ratings={friend.activityRatings} />
          ) : (
            <p className="text-xs text-muted-foreground">
              No activity ratings yet.{' '}
              <Link
                to={`/friends/${friend.id}/edit`}
                className="text-primary hover:underline"
              >
                Add some
              </Link>
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border-light bg-card p-5">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            Gift Ideas
          </h3>
          <GiftSection giftIdeas={friend.gifts} />
        </div>
        <div className="rounded-xl border border-border-light bg-card p-5">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
            Availability
          </h3>
          <AvailabilitySection availabilities={friend.availabilities} />
        </div>
      </div>

      {/* Connections */}
      <div className="mt-6 rounded-xl border border-border-light bg-card p-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Connections
        </h3>
        <ConnectionSection
          friendId={friend.id}
          connections={friend.connections}
          friends={allFriends}
        />
      </div>

      {/* Event History */}
      <div className="mt-6 rounded-xl border border-border-light bg-card p-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Event History
        </h3>
        <EventHistorySection invitations={friend.invitations} />
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-xl border border-border-light bg-card p-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Notes
        </h3>
        <NoteSection notes={friend.notes} />
      </div>
    </div>
  )
}

/** Inline gift ideas CRUD */
function GiftSection({
  giftIdeas,
}: {
  giftIdeas: Array<{
    id: string
    description: string
    url: string | null
    price: string | null
    purchased: boolean
    purchasedAt: string | null
  }>
}) {
  return (
    <div className="space-y-2">
      {giftIdeas.map(gift => (
        <div
          key={gift.id}
          className="flex items-center justify-between text-sm"
        >
          <span
            className={
              gift.purchased ? 'line-through text-muted-foreground' : ''
            }
          >
            {gift.description}
            {gift.price && (
              <span className="text-muted-foreground ml-1">
                (${gift.price})
              </span>
            )}
          </span>
          <div className="flex gap-1">
            <Form method="post">
              <input
                type="hidden"
                name="intent"
                value="toggle-gift-purchased"
              />
              <input type="hidden" name="giftId" value={gift.id} />
              <button
                type="submit"
                className="text-xs text-primary hover:underline"
              >
                {gift.purchased ? 'Undo' : 'Bought'}
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="delete-gift" />
              <input type="hidden" name="giftId" value={gift.id} />
              <button
                type="submit"
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </Form>
          </div>
        </div>
      ))}
      <Form method="post" className="flex gap-2 mt-2">
        <input type="hidden" name="intent" value="add-gift" />
        <input
          name="description"
          placeholder="Gift idea..."
          required
          className="flex-1 px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <input
          name="price"
          placeholder="Price"
          className="w-20 px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <button
          type="submit"
          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
        >
          Add
        </button>
      </Form>
    </div>
  )
}

/** Inline availability CRUD */
function AvailabilitySection({
  availabilities,
}: {
  availabilities: Array<{
    id: string
    label: string
    startDate: string
    endDate: string
  }>
}) {
  return (
    <div className="space-y-2">
      {availabilities.map(a => (
        <div key={a.id} className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{a.label}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              {a.startDate} to {a.endDate}
            </span>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="delete-availability" />
            <input type="hidden" name="availabilityId" value={a.id} />
            <button
              type="submit"
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </Form>
        </div>
      ))}
      <Form method="post" className="flex gap-2 mt-2">
        <input type="hidden" name="intent" value="add-availability" />
        <input
          name="label"
          placeholder="Label"
          required
          className="flex-1 px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <input
          name="startDate"
          type="date"
          required
          className="px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <input
          name="endDate"
          type="date"
          required
          className="px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <button
          type="submit"
          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
        >
          Add
        </button>
      </Form>
    </div>
  )
}

/** Inline connection CRUD */
function ConnectionSection({
  friendId,
  connections,
  friends,
}: {
  friendId: string
  connections: Array<{
    id: string
    type: string | null
    strength: number
    otherFriendId: string
    otherFriendName: string
  }>
  friends: Array<{ id: string; name: string }>
}) {
  const otherFriends = friends.filter(f => f.id !== friendId)

  return (
    <div className="space-y-2">
      {connections.length > 0 ? (
        <div className="space-y-2">
          {connections.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <Link
                  to={`/friends/${c.otherFriendId}`}
                  className="text-primary hover:underline"
                >
                  {c.otherFriendName}
                </Link>
                {c.type && (
                  <span className="text-muted-foreground ml-2">({c.type})</span>
                )}
                <span className="text-muted-foreground ml-2 text-xs">
                  Strength: {c.strength}/5
                </span>
              </div>
              <Form method="post">
                <input type="hidden" name="intent" value="delete-connection" />
                <input type="hidden" name="connectionId" value={c.id} />
                <button
                  type="submit"
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </Form>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No connections yet.</p>
      )}
      {otherFriends.length > 0 && (
        <Form method="post" className="flex gap-2 mt-2">
          <input type="hidden" name="intent" value="add-connection" />
          <input type="hidden" name="friendAId" value={friendId} />
          <select
            name="friendBId"
            required
            className="flex-1 px-2 py-1 text-sm rounded border border-input bg-card"
          >
            <option value="">Select friend...</option>
            {otherFriends.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            name="strength"
            className="w-20 px-2 py-1 text-sm rounded border border-input bg-card"
          >
            <option value="3">3</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <button
            type="submit"
            className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
          >
            Add
          </button>
        </Form>
      )}
    </div>
  )
}

/** Event history timeline */
function EventHistorySection({
  invitations,
}: {
  invitations: Array<{
    id: string
    eventId: string
    eventName: string
    eventDate: string | null
    eventStatus: string
    status: string
    attended: boolean | null
  }>
}) {
  if (invitations.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No event history yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {invitations.map(inv => (
        <div key={inv.id} className="flex items-center justify-between text-sm">
          <Link
            to={`/events/${inv.eventId}`}
            className="text-primary hover:underline"
          >
            {inv.eventName}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {inv.eventDate && <span>{inv.eventDate}</span>}
            <span className="capitalize">{inv.status.replace('_', ' ')}</span>
            {inv.attended !== null && (
              <span>{inv.attended ? 'Attended' : 'Did not attend'}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Inline notes CRUD */
function NoteSection({
  notes,
}: {
  notes: Array<{
    id: string
    content: string
    createdAt: Date
  }>
}) {
  return (
    <div className="space-y-2">
      {notes.map(n => (
        <div key={n.id} className="flex items-start justify-between text-sm">
          <p className="flex-1">{n.content}</p>
          <Form method="post" className="shrink-0 ml-2">
            <input type="hidden" name="intent" value="delete-note" />
            <input type="hidden" name="noteId" value={n.id} />
            <button
              type="submit"
              className="text-xs text-destructive hover:underline"
            >
              Delete
            </button>
          </Form>
        </div>
      ))}
      <Form method="post" className="flex gap-2 mt-2">
        <input type="hidden" name="intent" value="add-note" />
        <input
          name="content"
          placeholder="Add a note..."
          required
          className="flex-1 px-2 py-1 text-sm rounded border border-input bg-card"
        />
        <button
          type="submit"
          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
        >
          Add
        </button>
      </Form>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return <ErrorDisplay error={error} />
}
