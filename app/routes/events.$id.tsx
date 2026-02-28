import { parseWithZod } from '@conform-to/zod/v4'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Form, Link, redirect, useRouteError } from 'react-router'
import { Button } from '~/components/ui/button'
import { ErrorDisplay } from '~/components/ui/error-display'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { APP_NAME } from '~/config'
import { getActivities } from '~/lib/activity.server'
import {
  addInvitation,
  deleteEvent,
  getEventDetail,
  removeInvitation,
  updateEvent,
  updateInvitation,
} from '~/lib/event.server'
import { formatDate } from '~/lib/format'
import { getFriendOptions } from '~/lib/friend.server'
import { createNote, deleteNote, updateNote } from '~/lib/note.server'
import type { FriendRecommendation } from '~/lib/recommendation.server'
import { getRecommendations } from '~/lib/recommendation.server'
import {
  EVENT_STATUSES,
  EVENT_VIBE_LABELS,
  EVENT_VIBES,
  eventSchema,
  INVITATION_STATUS_LABELS,
  INVITATION_STATUSES,
  noteSchema,
} from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import type { Route } from './+types/events.$id'

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.event?.name || 'Event'} — ${APP_NAME}` }]
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const userId = session.user.id

  const event = getEventDetail(params.id, userId)
  if (!event) throw new Response('Not Found', { status: 404 })

  const friends = getFriendOptions(userId)
  const activities = getActivities(userId)
  const recommendations =
    event.status === 'planning' ? getRecommendations(params.id, userId) : []

  return { event, friends, activities, recommendations }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireSession(request)
  const userId = session.user.id
  const formData = await request.formData()
  const intent = formData.get('intent')

  try {
    switch (intent) {
      case 'update-event': {
        const submission = parseWithZod(formData, { schema: eventSchema })
        if (submission.status !== 'success') return submission.reply()
        updateEvent(params.id, submission.value, userId)
        return { ok: true }
      }
      case 'delete-event': {
        deleteEvent(params.id, userId)
        return redirect('/events')
      }
      case 'add-guest': {
        const friendId = formData.get('friendId') as string
        if (!friendId) return { error: 'Friend is required' }
        addInvitation(params.id, friendId)
        return { ok: true }
      }
      case 'remove-guest': {
        const invitationId = formData.get('invitationId') as string
        if (invitationId) removeInvitation(invitationId)
        return { ok: true }
      }
      case 'update-rsvp': {
        const invitationId = formData.get('invitationId') as string
        const status = formData.get('status') as string
        if (invitationId && status) updateInvitation(invitationId, { status })
        return { ok: true }
      }
      case 'update-attended': {
        const invitationId = formData.get('invitationId') as string
        const attendedValue = formData.get('attended') as string
        if (invitationId) {
          const attended =
            attendedValue === 'true'
              ? true
              : attendedValue === 'false'
                ? false
                : null
          updateInvitation(invitationId, { attended })
        }
        return { ok: true }
      }
      case 'toggle-invitation': {
        const friendId = formData.get('friendId') as string
        const invitationId = formData.get('invitationId') as string
        if (invitationId) removeInvitation(invitationId)
        else if (friendId) addInvitation(params.id, friendId)
        return { ok: true }
      }
      case 'add-note': {
        const submission = parseWithZod(formData, { schema: noteSchema })
        if (submission.status !== 'success') return submission.reply()
        createNote(
          {
            content: submission.value.content,
            type: 'event',
            eventId: params.id,
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

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = Number.parseInt(hours, 10)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${minutes} ${suffix}`
  } catch {
    return timeStr
  }
}

const statusColors: Record<string, string> = {
  planning: 'bg-warning/10 text-warning',
  finalized: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
}

export default function EventDetail({ loaderData }: Route.ComponentProps) {
  const { event, friends, activities, recommendations } = loaderData
  const [editing, setEditing] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)

  const invitedFriendIds = new Set(event.invitations.map(i => i.friendId))
  const availableFriends = friends.filter(f => !invitedFriendIds.has(f.id))

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        to="/events"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Events
      </Link>

      {/* Event header */}
      {editing ? (
        <EventEditForm
          event={event}
          activities={activities}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="rounded-xl border border-border-light bg-card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{event.name}</h2>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[event.status] || ''}`}
                >
                  {event.status}
                </span>
                {event.vibe && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                    {EVENT_VIBE_LABELS[event.vibe] || event.vibe}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-5 mt-2 text-sm text-muted-foreground">
                {event.activityName && (
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} /> {event.activityName}
                  </span>
                )}
                {event.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} /> {formatDate(event.date)}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatTime(event.time)}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {event.location}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} className="mr-2" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Recommendations — only while planning */}
      {event.status === 'planning' && recommendations.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card mb-6">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Guest List Recommendations
            </h3>
            <Link
              to={`/events/${event.id}`}
              reloadDocument
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border hover:bg-accent transition-colors text-muted-foreground"
            >
              <RefreshCw size={12} />
              Recalculate
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="py-3 px-3 w-10" />
                  <th className="text-left py-3 px-3">Name</th>
                  <th className="text-center py-3 px-3">Score</th>
                  <th className="text-center py-3 px-3">Interest</th>
                  <th className="text-center py-3 px-3">Closeness</th>
                  <th className="text-center py-3 px-3">Social</th>
                  <th className="text-left py-3 px-3">Why</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map(rec => (
                  <RecommendationRow key={rec.friendId} rec={rec} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guest list */}
      <div className="rounded-xl border border-border-light bg-card">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Guest List ({event.invitations.length}
            {event.capacity ? ` / ${event.capacity}` : ''})
          </h3>
          <Button size="sm" onClick={() => setAddingGuest(!addingGuest)}>
            <Plus size={14} className="mr-2" />
            Add Guest
          </Button>
        </div>

        {addingGuest && (
          <div className="p-4 border-b bg-muted/50">
            <Form method="post" className="flex items-center gap-3">
              <input type="hidden" name="intent" value="add-guest" />
              <select
                name="friendId"
                className="flex-1 h-9 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Select a friend...</option>
                {availableFriends.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit">
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setAddingGuest(false)}
              >
                Cancel
              </Button>
            </Form>
          </div>
        )}

        {event.invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>No guests yet. Add friends to the guest list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Tier</th>
                  <th className="text-left py-3 px-4">RSVP</th>
                  <th className="text-left py-3 px-4">Attended</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {event.invitations.map(inv => (
                  <GuestRow key={inv.id} invitation={inv} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-xl border border-border-light bg-card p-5">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
          Notes
        </h3>
        <div className="space-y-2">
          {event.notes.map(n => (
            <div
              key={n.id}
              className="flex items-start justify-between text-sm"
            >
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
      </div>

      {/* Delete */}
      <div className="mt-8">
        <DeleteEventButton />
      </div>
    </div>
  )
}

function RecommendationRow({ rec }: { rec: FriendRecommendation }) {
  return (
    <tr
      className={`border-b transition-colors ${
        rec.isInvited
          ? 'bg-primary/5 hover:bg-primary/10'
          : !rec.available
            ? 'opacity-60'
            : 'hover:bg-accent/50'
      }`}
    >
      <td className="py-2.5 px-3">
        <Form method="post">
          <input type="hidden" name="intent" value="toggle-invitation" />
          <input type="hidden" name="friendId" value={rec.friendId} />
          {rec.invitationId && (
            <input type="hidden" name="invitationId" value={rec.invitationId} />
          )}
          <button
            type="submit"
            className={`p-1 rounded-full transition-colors ${
              rec.isInvited
                ? 'text-primary hover:text-primary/70'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {rec.isInvited ? (
              <CheckCircle2 size={18} />
            ) : (
              <PlusCircle size={18} />
            )}
          </button>
        </Form>
      </td>
      <td className="py-2.5 px-3">
        <Link
          to={`/friends/${rec.friendId}`}
          className="text-sm font-medium hover:text-primary"
        >
          {rec.friendName}
        </Link>
        {rec.tierLabel && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-2"
            style={{
              color: rec.tierColor || undefined,
              borderColor: rec.tierColor || undefined,
              border: '1px solid',
            }}
          >
            {rec.tierLabel}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-sm font-bold">{rec.score}</span>
      </td>
      <td className="py-2.5 px-3 text-center">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted">
          {rec.interest.rating}
        </span>
      </td>
      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
        {rec.closeness.tier || '\u2014'}
      </td>
      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">
        {rec.socialFit.of > 0
          ? `${rec.socialFit.knows}/${rec.socialFit.of}`
          : '\u2014'}
      </td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground">
        {rec.explanation}
      </td>
    </tr>
  )
}

function EventEditForm({
  event,
  activities,
  onCancel,
}: {
  event: {
    name: string
    activityId: string | null
    status: string
    date: string | null
    time: string | null
    location: string | null
    capacity: number | null
    vibe: string | null
  }
  activities: Array<{ id: string; name: string }>
  onCancel: () => void
}) {
  return (
    <Form
      method="post"
      className="rounded-xl border border-border-light bg-card p-6 mb-6 space-y-4"
    >
      <input type="hidden" name="intent" value="update-event" />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="edit-name">
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input id="edit-name" name="name" defaultValue={event.name} />
        </div>
        <div>
          <Label htmlFor="edit-activityId">Activity</Label>
          <select
            id="edit-activityId"
            name="activityId"
            defaultValue={event.activityId || ''}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm"
          >
            <option value="">None</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="edit-status">Status</Label>
          <select
            id="edit-status"
            name="status"
            defaultValue={event.status}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm"
          >
            {EVENT_STATUSES.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="edit-date">Date</Label>
          <Input
            id="edit-date"
            name="date"
            type="date"
            defaultValue={event.date || ''}
          />
        </div>
        <div>
          <Label htmlFor="edit-time">Time</Label>
          <Input
            id="edit-time"
            name="time"
            type="time"
            defaultValue={event.time || ''}
          />
        </div>
        <div>
          <Label htmlFor="edit-location">Location</Label>
          <Input
            id="edit-location"
            name="location"
            defaultValue={event.location || ''}
          />
        </div>
        <div>
          <Label htmlFor="edit-capacity">Capacity</Label>
          <Input
            id="edit-capacity"
            name="capacity"
            type="number"
            min={1}
            max={1000}
            defaultValue={event.capacity?.toString() || ''}
          />
        </div>
        <div>
          <Label htmlFor="edit-vibe">Vibe</Label>
          <select
            id="edit-vibe"
            name="vibe"
            defaultValue={event.vibe || ''}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm"
          >
            <option value="">None</option>
            {EVENT_VIBES.map(v => (
              <option key={v} value={v}>
                {EVENT_VIBE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">Save Changes</Button>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  )
}

function GuestRow({
  invitation,
}: {
  invitation: {
    id: string
    friendId: string
    friendName: string
    tierLabel: string | null
    tierColor: string | null
    status: string
    attended: boolean | null
  }
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="border-b hover:bg-accent/50 transition-colors">
      <td className="py-3 px-4">
        <Link
          to={`/friends/${invitation.friendId}`}
          className="text-sm font-medium hover:text-primary"
        >
          {invitation.friendName}
        </Link>
      </td>
      <td className="py-3 px-4">
        {invitation.tierLabel ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              color: invitation.tierColor || undefined,
              borderColor: invitation.tierColor || undefined,
              border: '1px solid',
            }}
          >
            {invitation.tierLabel}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No tier</span>
        )}
      </td>
      <td className="py-3 px-4">
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="update-rsvp" />
          <input type="hidden" name="invitationId" value={invitation.id} />
          <select
            name="status"
            defaultValue={invitation.status}
            onChange={e => e.target.form?.requestSubmit()}
            className="text-xs px-2 py-1 rounded-lg border border-input bg-card font-medium"
          >
            {INVITATION_STATUSES.map(s => (
              <option key={s} value={s}>
                {INVITATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Form>
      </td>
      <td className="py-3 px-4">
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="update-attended" />
          <input type="hidden" name="invitationId" value={invitation.id} />
          <select
            name="attended"
            defaultValue={
              invitation.attended === null ? '' : String(invitation.attended)
            }
            onChange={e => e.target.form?.requestSubmit()}
            className="text-xs px-2 py-1 rounded-lg border border-input bg-card font-medium"
          >
            <option value="">{'\u2014'}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </Form>
      </td>
      <td className="py-3 px-4 text-right">
        {confirmDelete ? (
          <div className="flex items-center justify-end gap-1">
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="remove-guest" />
              <input type="hidden" name="invitationId" value={invitation.id} />
              <button
                type="submit"
                className="p-1.5 rounded text-destructive hover:bg-destructive/10"
              >
                <Check size={14} />
              </button>
            </Form>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded text-muted-foreground hover:bg-accent"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}

function DeleteEventButton() {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-destructive">
          Are you sure you want to delete this event?
        </span>
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="delete-event" />
          <Button variant="destructive" size="sm" type="submit">
            Delete
          </Button>
        </Form>
        <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
    >
      <Trash2 size={14} />
      Delete Event
    </button>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  return <ErrorDisplay error={error} />
}
