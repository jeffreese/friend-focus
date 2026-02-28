import { parseWithZod } from '@conform-to/zod/v4'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  MapPin,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Form, Link, redirect, useRouteError } from 'react-router'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { ErrorDisplay } from '~/components/ui/error-display'
import { FormField } from '~/components/ui/form-field'
import { InlineConfirmDelete } from '~/components/ui/inline-confirm-delete'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select } from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
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

type GuestSortKey = 'name' | 'tier' | 'rsvp' | 'attended'
type SortDir = 'asc' | 'desc'

const RSVP_ORDER: Record<string, number> = {
  attending: 0,
  invited: 1,
  not_invited: 2,
  declined: 3,
}

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: GuestSortKey
  sortKey: GuestSortKey
  sortDir: SortDir
}) {
  if (column !== sortKey)
    return <ChevronsUpDown size={12} className="ml-1 opacity-40 shrink-0" />
  return sortDir === 'asc' ? (
    <ChevronUp size={12} className="ml-1 shrink-0" />
  ) : (
    <ChevronDown size={12} className="ml-1 shrink-0" />
  )
}

export default function EventDetail({ loaderData }: Route.ComponentProps) {
  const { event, friends, activities, recommendations } = loaderData
  const [editing, setEditing] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [sortKey, setSortKey] = useState<GuestSortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: GuestSortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedInvitations = [...event.invitations].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.friendName.localeCompare(b.friendName)
        break
      case 'tier': {
        const aOrder = a.tierSortOrder ?? Number.MAX_SAFE_INTEGER
        const bOrder = b.tierSortOrder ?? Number.MAX_SAFE_INTEGER
        cmp = aOrder - bOrder
        break
      }
      case 'rsvp':
        cmp = (RSVP_ORDER[a.status] ?? 99) - (RSVP_ORDER[b.status] ?? 99)
        break
      case 'attended': {
        const aVal = a.attended === true ? 0 : a.attended === null ? 1 : 2
        const bVal = b.attended === true ? 0 : b.attended === null ? 1 : 2
        cmp = aVal - bVal
        break
      }
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const invitedFriendIds = new Set(event.invitations.map(i => i.friendId))
  const availableFriends = friends.filter(f => !invitedFriendIds.has(f.id))

  return (
    <div className="max-w-5xl mx-auto">
      <BackLink to="/events">Back to Events</BackLink>

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
          <div className="p-5 border-b border-border-light flex items-center justify-between">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Interest</TableHead>
                <TableHead className="text-center">Closeness</TableHead>
                <TableHead className="text-center">Social</TableHead>
                <TableHead>Why</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map(rec => (
                <RecommendationRow key={rec.friendId} rec={rec} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Guest list */}
      <div className="rounded-xl border border-border-light bg-card">
        <div className="p-5 border-b border-border-light flex items-center justify-between">
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
          <div className="p-4 border-b border-border-light bg-muted/50">
            <Form method="post" className="flex items-center gap-3">
              <input type="hidden" name="intent" value="add-guest" />
              <Select name="friendId" className="flex-1">
                <option value="">Select a friend...</option>
                {availableFriends.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
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
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    { key: 'name', label: 'Name' },
                    { key: 'tier', label: 'Tier' },
                    { key: 'rsvp', label: 'RSVP' },
                    { key: 'attended', label: 'Attended' },
                  ] as const
                ).map(col => (
                  <TableHead key={col.key}>
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon
                        column={col.key}
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvitations.map(inv => (
                <GuestRow key={inv.id} invitation={inv} />
              ))}
            </TableBody>
          </Table>
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
            <Input
              name="content"
              placeholder="Add a note..."
              required
              className="flex-1"
            />
            <Button size="sm" type="submit">
              Add
            </Button>
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
    <TableRow
      className={
        rec.isInvited
          ? 'bg-primary/5 hover:bg-primary/10'
          : !rec.available
            ? 'opacity-60'
            : ''
      }
    >
      <TableCell>
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
      </TableCell>
      <TableCell className="font-medium">
        <Link
          to={`/friends/${rec.friendId}`}
          className="hover:text-primary transition-colors"
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
      </TableCell>
      <TableCell className="text-center font-bold">{rec.score}</TableCell>
      <TableCell className="text-center">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted">
          {rec.interest.rating}
        </span>
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground">
        {rec.closeness.tier || '\u2014'}
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground">
        {rec.socialFit.of > 0
          ? `${rec.socialFit.knows}/${rec.socialFit.of}`
          : '\u2014'}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {rec.explanation}
      </TableCell>
    </TableRow>
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
        <FormField className="col-span-2">
          <Label htmlFor="edit-name">
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input id="edit-name" name="name" defaultValue={event.name} />
        </FormField>
        <FormField>
          <Label htmlFor="edit-activityId">Activity</Label>
          <Select
            id="edit-activityId"
            name="activityId"
            defaultValue={event.activityId || ''}
          >
            <option value="">None</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField>
          <Label htmlFor="edit-status">Status</Label>
          <Select id="edit-status" name="status" defaultValue={event.status}>
            {EVENT_STATUSES.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField>
          <Label htmlFor="edit-date">Date</Label>
          <Input
            id="edit-date"
            name="date"
            type="date"
            defaultValue={event.date || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="edit-time">Time</Label>
          <Input
            id="edit-time"
            name="time"
            type="time"
            defaultValue={event.time || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="edit-location">Location</Label>
          <Input
            id="edit-location"
            name="location"
            defaultValue={event.location || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="edit-capacity">Capacity</Label>
          <Input
            id="edit-capacity"
            name="capacity"
            type="number"
            min={1}
            max={1000}
            defaultValue={event.capacity?.toString() || ''}
          />
        </FormField>
        <FormField>
          <Label htmlFor="edit-vibe">Vibe</Label>
          <Select id="edit-vibe" name="vibe" defaultValue={event.vibe || ''}>
            <option value="">None</option>
            {EVENT_VIBES.map(v => (
              <option key={v} value={v}>
                {EVENT_VIBE_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
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
    tierSortOrder: number | null
    status: string
    attended: boolean | null
  }
}) {
  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        <Link
          to={`/friends/${invitation.friendId}`}
          className="hover:text-primary"
        >
          {invitation.friendName}
        </Link>
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="update-rsvp" />
          <input type="hidden" name="invitationId" value={invitation.id} />
          <Select
            name="status"
            defaultValue={invitation.status}
            onChange={e => e.target.form?.requestSubmit()}
            className="h-7 text-xs w-auto"
          >
            {INVITATION_STATUSES.map(s => (
              <option key={s} value={s}>
                {INVITATION_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Form>
      </TableCell>
      <TableCell>
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="update-attended" />
          <input type="hidden" name="invitationId" value={invitation.id} />
          <Select
            name="attended"
            defaultValue={
              invitation.attended === null ? '' : String(invitation.attended)
            }
            onChange={e => e.target.form?.requestSubmit()}
            className="h-7 text-xs w-auto"
          >
            <option value="">{'\u2014'}</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </Form>
      </TableCell>
      <TableCell className="text-right">
        <InlineConfirmDelete>
          <Form method="post" className="inline">
            <input type="hidden" name="intent" value="remove-guest" />
            <input type="hidden" name="invitationId" value={invitation.id} />
            <button
              type="submit"
              className="text-destructive hover:text-destructive/80 transition-colors p-1"
              aria-label="Confirm delete"
            >
              <Check size={14} />
            </button>
          </Form>
        </InlineConfirmDelete>
      </TableCell>
    </TableRow>
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
