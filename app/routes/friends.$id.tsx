import { parseWithZod } from '@conform-to/zod/v4'
import {
  Briefcase,
  Cake,
  CalendarDays,
  Check,
  Clock,
  Edit,
  FileText,
  Gift,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Form, Link, useActionData, useRouteError } from 'react-router'
import { ActivityInterestsSummary } from '~/components/activity-interests-summary'
import { CareModeBadge, CareModeBanner } from '~/components/care-mode-indicator'
import { Avatar } from '~/components/ui/avatar'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { ErrorDisplay } from '~/components/ui/error-display'
import { InlineConfirmDelete } from '~/components/ui/inline-confirm-delete'
import { Input } from '~/components/ui/input'
import { SectionCard } from '~/components/ui/section-card'
import { Select } from '~/components/ui/select'
import { StrengthDots } from '~/components/ui/strength-dots'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { APP_NAME } from '~/config'
import {
  createAvailability,
  deleteAvailability,
} from '~/lib/availability.server'
import { formatBirthday, formatDate } from '~/lib/format'
import { getFriendDetail, getFriendOptions } from '~/lib/friend.server'
import {
  createConnection,
  deleteConnection,
  updateConnection,
} from '~/lib/friend-connection.server'
import {
  createGiftIdea,
  deleteGiftIdea,
  toggleGiftPurchased,
} from '~/lib/gift-idea.server'
import { createNote, deleteNote, updateNote } from '~/lib/note.server'
import {
  availabilitySchema,
  CONNECTION_STRENGTHS,
  CONNECTION_TYPE_COLORS,
  CONNECTION_TYPES,
  friendConnectionSchema,
  giftIdeaSchema,
  noteSchema,
} from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import { cn } from '~/lib/utils'
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
      case 'update-connection': {
        const connectionId = formData.get('connectionId') as string
        if (!connectionId) return { error: 'Connection ID required' }
        const type = formData.get('type') as string
        const strength = Number(formData.get('strength'))
        const howTheyMet = formData.get('howTheyMet') as string
        const startDate = formData.get('startDate') as string
        updateConnection(connectionId, {
          type: type || null,
          strength: strength || 3,
          howTheyMet: howTheyMet || null,
          startDate: startDate || null,
        })
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
  const [addingGift, setAddingGift] = useState(false)
  const [addingAvailability, setAddingAvailability] = useState(false)
  const [addingConnection, setAddingConnection] = useState(false)
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null,
  )
  const [addingNote, setAddingNote] = useState(false)

  const otherFriends = allFriends.filter(f => f.id !== friend.id)

  const attendedCount = friend.invitations.filter(i => i.attended).length
  const totalEvents = friend.invitations.length
  const attendancePercent =
    totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0

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
            <Avatar
              name={friend.name}
              size="lg"
              color={friend.tierColor || undefined}
            />
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
                {friend.birthday && (
                  <span className="flex items-center gap-1">
                    <Cake size={14} /> {formatBirthday(friend.birthday)}
                  </span>
                )}
                {friend.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {friend.location}
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

      {/* Detail sections — three columns */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Activity Interests */}
        <SectionCard
          icon={<Sparkles size={18} className="text-primary" />}
          title="Activity Interests"
        >
          {friend.activityRatings && friend.activityRatings.length > 0 ? (
            <ActivityInterestsSummary ratings={friend.activityRatings} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No activity ratings yet.{' '}
              <Link
                to={`/friends/${friend.id}/edit`}
                className="text-primary hover:underline"
              >
                Add some
              </Link>
            </p>
          )}
        </SectionCard>

        {/* Gift Ideas */}
        <SectionCard
          icon={<Gift size={18} className="text-primary" />}
          title="Gift Ideas"
          count={friend.gifts.length}
          action={
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setAddingGift(!addingGift)}
            >
              <Plus size={14} />
              Add
            </Button>
          }
        >
          {addingGift && (
            <Form
              method="post"
              className="flex gap-2 mb-3 pb-3 border-b border-border-light"
              onSubmit={() => setAddingGift(false)}
            >
              <input type="hidden" name="intent" value="add-gift" />
              <Input
                name="description"
                placeholder="Gift idea..."
                required
                className="flex-1"
              />
              <Input name="price" placeholder="Price" className="w-20" />
              <Button size="sm" type="submit">
                Save
              </Button>
            </Form>
          )}
          {friend.gifts.length > 0 ? (
            <div className="space-y-2">
              {friend.gifts.map(gift => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between text-sm group"
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
            </div>
          ) : !addingGift ? (
            <p className="text-sm text-muted-foreground">
              No gift ideas yet.{' '}
              <button
                type="button"
                onClick={() => setAddingGift(true)}
                className="text-primary hover:underline"
              >
                Add one
              </button>
            </p>
          ) : null}
        </SectionCard>

        {/* Availability */}
        <SectionCard
          icon={<Clock size={18} className="text-primary" />}
          title="Availability"
          count={friend.availabilities.length}
          action={
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setAddingAvailability(!addingAvailability)}
            >
              <Plus size={14} />
              Add
            </Button>
          }
        >
          {addingAvailability && (
            <Form
              method="post"
              className="flex gap-2 mb-3 pb-3 border-b border-border-light"
              onSubmit={() => setAddingAvailability(false)}
            >
              <input type="hidden" name="intent" value="add-availability" />
              <Input
                name="label"
                placeholder="Label"
                required
                className="flex-1"
              />
              <Input name="startDate" type="date" required className="w-32" />
              <Input name="endDate" type="date" required className="w-32" />
              <Button size="sm" type="submit">
                Save
              </Button>
            </Form>
          )}
          {friend.availabilities.length > 0 ? (
            <div className="space-y-2">
              {friend.availabilities.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-sm group"
                >
                  <div>
                    <span className="font-medium">{a.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {a.startDate} to {a.endDate}
                    </span>
                  </div>
                  <Form method="post">
                    <input
                      type="hidden"
                      name="intent"
                      value="delete-availability"
                    />
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
            </div>
          ) : !addingAvailability ? (
            <p className="text-sm text-muted-foreground">
              No availability windows yet.{' '}
              <button
                type="button"
                onClick={() => setAddingAvailability(true)}
                className="text-primary hover:underline"
              >
                Add one
              </button>
            </p>
          ) : null}
        </SectionCard>
      </div>

      {/* Connections */}
      <SectionCard
        className="mb-6"
        icon={<Users size={18} className="text-primary" />}
        title="Connections"
        count={friend.connections.length}
        action={
          otherFriends.length > 0 ? (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setAddingConnection(!addingConnection)}
            >
              <Plus size={14} />
              Add
            </Button>
          ) : undefined
        }
      >
        {addingConnection && (
          <Form
            method="post"
            className="space-y-2 mb-4 pb-4 border-b border-border-light"
            onSubmit={() => setAddingConnection(false)}
          >
            <input type="hidden" name="intent" value="add-connection" />
            <input type="hidden" name="friendAId" value={friend.id} />
            <Select name="friendBId" required>
              <option value="">Select friend...</option>
              {otherFriends.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select name="type">
                <option value="">Type (optional)</option>
                {CONNECTION_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Select name="strength" defaultValue="3">
                {CONNECTION_STRENGTHS.map((s, i) => (
                  <option key={s} value={i + 1}>
                    {i + 1} — {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input name="howTheyMet" placeholder="How they met" />
              <Input name="startDate" type="date" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" type="submit">
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setAddingConnection(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
        {friend.connections.length > 0 ? (
          <div className="space-y-2">
            {friend.connections.map(c => {
              const strengthLabel =
                CONNECTION_STRENGTHS[(c.strength ?? 3) - 1] || 'Unknown'
              const tierColor = c.otherFriendTierColor
              const typeColor = c.type
                ? CONNECTION_TYPE_COLORS[c.type]
                : undefined
              const isEditing = editingConnectionId === c.id

              if (isEditing) {
                return (
                  <Form
                    key={c.id}
                    method="post"
                    className="space-y-2 p-3 rounded-lg border border-border-light bg-muted/30"
                    onSubmit={() => setEditingConnectionId(null)}
                  >
                    <input
                      type="hidden"
                      name="intent"
                      value="update-connection"
                    />
                    <input type="hidden" name="connectionId" value={c.id} />
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        name={c.otherFriendName}
                        size="sm"
                        color={tierColor || undefined}
                      />
                      <span className="text-sm font-medium">
                        {c.otherFriendName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select name="type" defaultValue={c.type || ''}>
                        <option value="">Type (optional)</option>
                        {CONNECTION_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                      <Select
                        name="strength"
                        defaultValue={String(c.strength ?? 3)}
                      >
                        {CONNECTION_STRENGTHS.map((s, i) => (
                          <option key={s} value={i + 1}>
                            {i + 1} — {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        name="howTheyMet"
                        placeholder="How they met"
                        defaultValue={c.howTheyMet || ''}
                      />
                      <Input
                        name="startDate"
                        type="date"
                        defaultValue={c.startDate || ''}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" type="submit">
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setEditingConnectionId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                )
              }

              return (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-center justify-between py-3 px-4 rounded-lg border group',
                    typeColor
                      ? `${typeColor.bg} ${typeColor.text} ${typeColor.border}`
                      : 'border-border-light',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={c.otherFriendName}
                      size="sm"
                      color={tierColor || undefined}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/friends/${c.otherFriendId}`}
                          className="text-sm font-medium hover:text-primary transition-colors"
                        >
                          {c.otherFriendName}
                        </Link>
                        {c.type && (
                          <span className="text-xs opacity-75">{c.type}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StrengthDots
                          value={c.strength ?? 3}
                          label={strengthLabel}
                          className="text-muted-foreground"
                        />
                        {c.howTheyMet && (
                          <span className="text-[10px] text-muted-foreground">
                            · {c.howTheyMet}
                          </span>
                        )}
                        {c.startDate && (
                          <span className="text-[10px] text-muted-foreground">
                            · Since {formatDate(c.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingConnectionId(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1"
                      aria-label="Edit connection"
                    >
                      <Edit size={14} />
                    </button>
                    <InlineConfirmDelete>
                      <Form method="post" className="inline">
                        <input
                          type="hidden"
                          name="intent"
                          value="delete-connection"
                        />
                        <input type="hidden" name="connectionId" value={c.id} />
                        <button
                          type="submit"
                          className="text-destructive hover:text-destructive/80 transition-colors p-1"
                          aria-label="Confirm delete"
                        >
                          <Check size={14} />
                        </button>
                      </Form>
                    </InlineConfirmDelete>
                  </div>
                </div>
              )
            })}
          </div>
        ) : !addingConnection ? (
          <p className="text-sm text-muted-foreground">
            No connections yet.{' '}
            {otherFriends.length > 0 && (
              <button
                type="button"
                onClick={() => setAddingConnection(true)}
                className="text-primary hover:underline"
              >
                Add one
              </button>
            )}
          </p>
        ) : null}
      </SectionCard>

      {/* Event History */}
      <SectionCard
        className="mb-6"
        icon={<CalendarDays size={18} className="text-primary" />}
        title="Event History"
        count={totalEvents}
      >
        {totalEvents > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Attended {attendedCount} of {totalEvents} events (
              {attendancePercent}%)
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Attended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {friend.invitations.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/events/${inv.eventId}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {inv.eventName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.eventDate ? formatDate(inv.eventDate) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {inv.attended === true && (
                        <Check
                          size={16}
                          className="inline-block text-success"
                        />
                      )}
                      {inv.attended === false && (
                        <X
                          size={16}
                          className="inline-block text-destructive"
                        />
                      )}
                      {inv.attended === null && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No event history yet.</p>
        )}
      </SectionCard>

      {/* Notes */}
      <SectionCard
        icon={<FileText size={18} className="text-primary" />}
        title="Notes"
        count={friend.notes.length}
        action={
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setAddingNote(!addingNote)}
          >
            <Plus size={14} />
            Add
          </Button>
        }
      >
        {addingNote && (
          <Form
            method="post"
            className="flex gap-2 mb-3 pb-3 border-b border-border-light"
            onSubmit={() => setAddingNote(false)}
          >
            <input type="hidden" name="intent" value="add-note" />
            <Input
              name="content"
              placeholder="Add a note..."
              required
              className="flex-1"
            />
            <Button size="sm" type="submit">
              Save
            </Button>
          </Form>
        )}
        {friend.notes.length > 0 ? (
          <div className="space-y-2">
            {friend.notes.map(n => (
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
          </div>
        ) : !addingNote ? (
          <p className="text-sm text-muted-foreground">
            No notes yet.{' '}
            <button
              type="button"
              onClick={() => setAddingNote(true)}
              className="text-primary hover:underline"
            >
              Add one
            </button>
          </p>
        ) : null}
      </SectionCard>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return <ErrorDisplay error={error} />
}
