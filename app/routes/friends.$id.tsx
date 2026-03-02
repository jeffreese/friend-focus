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
  Link2,
  Link2Off,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Form, Link, useActionData, useRouteError } from 'react-router'
import { toast } from 'sonner'
import { ActivityInterestsSummary } from '~/components/activity-interests-summary'
import { CareModeBadge, CareModeBanner } from '~/components/care-mode-indicator'
import { GoogleContactLinkDialog } from '~/components/google-contact-link-dialog'
import { SyncDiffBanner, SyncDiffDialog } from '~/components/google-sync-diff'
import { Avatar } from '~/components/ui/avatar'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { ErrorDisplay } from '~/components/ui/error-display'
import { GoogleIcon } from '~/components/ui/google-button'
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
import {
  hasContactsReadScope,
  hasContactsWriteScope,
} from '~/lib/google-contacts.server'
import {
  type FieldDiff,
  getCachedContactsWithStatus,
} from '~/lib/google-contacts-sync.server'
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

  // Google Contacts integration data
  const hasGoogleContacts = await hasContactsReadScope(userId)
  const hasGoogleWrite = hasGoogleContacts && hasContactsWriteScope(userId)
  const isLinked = !!friend.googleContactResourceName

  let syncStatus: 'fresh' | 'stale' | 'never' = 'never'
  if (isLinked && friend.lastGoogleSyncAt) {
    const lastSync = new Date(friend.lastGoogleSyncAt)
    const daysSinceSync =
      (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24)
    syncStatus = daysSinceSync > 30 ? 'stale' : 'fresh'
  }

  // Get cached contacts for the link dialog (only if Google connected)
  let cachedContacts: Awaited<ReturnType<typeof getCachedContactsWithStatus>> =
    []
  if (hasGoogleContacts) {
    cachedContacts = getCachedContactsWithStatus(userId)
  }

  return {
    friend,
    allFriends,
    hasGoogleContacts,
    hasGoogleWrite,
    isLinked,
    syncStatus,
    cachedContacts,
  }
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
  const {
    friend,
    allFriends,
    hasGoogleContacts,
    hasGoogleWrite,
    isLinked,
    syncStatus,
    cachedContacts,
  } = loaderData
  const actionData = useActionData<typeof action>()

  // Show action errors as toasts
  useEffect(() => {
    if (
      actionData &&
      'error' in actionData &&
      typeof actionData.error === 'string'
    ) {
      toast.error(actionData.error)
    }
  }, [actionData])

  const [addingGift, setAddingGift] = useState(false)
  const [addingAvailability, setAddingAvailability] = useState(false)
  const [addingConnection, setAddingConnection] = useState(false)
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null,
  )
  const [addingNote, setAddingNote] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteFromGoogle, setDeleteFromGoogle] = useState(false)

  // Google sync state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [pendingDiffs, setPendingDiffs] = useState<FieldDiff[] | null>(null)
  const [showDiffDialog, setShowDiffDialog] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Background sync-on-view for stale linked friends
  useEffect(() => {
    if (syncStatus !== 'stale' || !isLinked) return

    let cancelled = false

    async function backgroundSync() {
      try {
        const res = await fetch('/api/google-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: 'sync-friend',
            friendId: friend.id,
          }),
        })
        if (cancelled) return
        const result = await res.json()

        if (result.status === 'changes-detected' && result.diffs?.length > 0) {
          setPendingDiffs(result.diffs)
        } else if (result.error === 'google-auth-expired') {
          setSyncError('Google connection expired. Reconnect on Profile page.')
        }
      } catch {
        // Silently fail background sync
      }
    }

    backgroundSync()
    return () => {
      cancelled = true
    }
  }, [syncStatus, isLinked, friend.id])

  async function handleManualSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'sync-friend',
          friendId: friend.id,
        }),
      })
      const result = await res.json()

      if (result.status === 'changes-detected' && result.diffs?.length > 0) {
        setPendingDiffs(result.diffs)
      } else if (result.status === 'unlinked') {
        window.location.reload()
      } else if (result.error === 'google-auth-expired') {
        setSyncError('Google connection expired. Reconnect on Profile page.')
      }
    } catch {
      setSyncError('Sync failed. Try again later.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleLink(resourceName: string) {
    setShowLinkDialog(false)
    try {
      // Step 1: Link the friend to the Google contact
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'link',
          friendId: friend.id,
          resourceName,
        }),
      })

      // Step 2: Immediately sync to detect field differences
      const syncRes = await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'sync-friend',
          friendId: friend.id,
          forceCompare: true,
        }),
      })
      const syncResult = await syncRes.json()

      if (
        syncResult.status === 'changes-detected' &&
        syncResult.diffs?.length > 0
      ) {
        const diffs = syncResult.diffs as FieldDiff[]

        // Check if all diffs are non-conflicting (one side empty, other has data)
        const allNonConflicting = diffs.every(
          d => (!d.appValue && d.googleValue) || (d.appValue && !d.googleValue),
        )

        if (allNonConflicting) {
          // Auto-apply: fill empty fields from whichever side has data
          const autoResolutions = diffs.map(d => ({
            field: d.field,
            action: (d.appValue ? 'keep-app' : 'use-google') as
              | 'use-google'
              | 'keep-app',
            value: d.appValue || d.googleValue || undefined,
          }))
          await fetch('/api/google-contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intent: 'resolve-diffs',
              friendId: friend.id,
              resolutions: autoResolutions,
            }),
          })
          toast.success('Linked to Google contact — all data is in sync.')
          window.location.reload()
        } else {
          // Has real conflicts — show the diff dialog for user review
          setPendingDiffs(diffs)
          setShowDiffDialog(true)
        }
      } else {
        toast.success('Linked to Google contact — all data is in sync.')
        window.location.reload()
      }
    } catch {
      // If something fails, still reload to show current state
      window.location.reload()
    }
  }

  async function handleUnlink() {
    if (!confirm('Unlink this friend from their Google contact?')) return
    try {
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'unlink',
          friendId: friend.id,
        }),
      })
      window.location.reload()
    } catch {
      // Silently fail
    }
  }

  async function handleApplyDiffs(
    resolutions: Array<{
      field: string
      action: 'use-google' | 'keep-app' | 'push-to-google' | 'skip'
      value?: string
    }>,
  ) {
    setShowDiffDialog(false)
    setPendingDiffs(null)
    try {
      await fetch('/api/google-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'resolve-diffs',
          friendId: friend.id,
          resolutions,
        }),
      })
      window.location.reload()
    } catch {
      // Silently fail
    }
  }

  // Compute suggested contacts for the link dialog
  const suggestedContacts = cachedContacts.filter(
    c =>
      !c.linkedFriendId &&
      c.suggestedFriendId === friend.id &&
      c.suggestedConfidence >= 0.5,
  )
  const unlinkableContacts = cachedContacts.filter(c => !c.linkedFriendId)

  const otherFriends = allFriends.filter(f => f.id !== friend.id)

  const attendedCount = friend.invitations.filter(i => i.attended).length
  const totalEvents = friend.invitations.length
  const attendancePercent =
    totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <BackLink to="/friends">Back to Friends</BackLink>

      {/* Sync diff banner */}
      {pendingDiffs && pendingDiffs.length > 0 && !showDiffDialog && (
        <SyncDiffBanner
          friendName={friend.name}
          diffCount={pendingDiffs.length}
          onReview={() => setShowDiffDialog(true)}
          onDismiss={() => setPendingDiffs(null)}
        />
      )}

      {/* Profile header */}
      <div className="rounded-xl border border-border-light bg-card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={friend.name}
              src={friend.photo ? `/api/photos/${friend.photo}` : undefined}
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
                {friend.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {friend.address}
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
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                setDeleteFromGoogle(false)
                setShowDeleteConfirm(true)
              }}
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </Button>
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

        {/* Google Contacts link/sync */}
        {hasGoogleContacts && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            {isLinked ? (
              <>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <GoogleIcon className="size-3.5" />
                  Linked to Google Contact
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={syncing}
                >
                  <RefreshCw
                    size={12}
                    className={`mr-1 ${syncing ? 'animate-spin' : ''}`}
                  />
                  {syncing ? 'Syncing...' : 'Sync'}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={handleUnlink}
                >
                  <Link2Off size={12} className="mr-1" />
                  Unlink
                </Button>
                {syncError && (
                  <span className="text-xs text-destructive">{syncError}</span>
                )}
              </>
            ) : (
              <Button
                size="xs"
                variant="outline"
                onClick={() => setShowLinkDialog(true)}
              >
                <Link2 size={12} className="mr-1" />
                Link to Google Contact
              </Button>
            )}
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
            <ActivityInterestsSummary
              ratings={friend.activityRatings}
              friendId={friend.id}
              friendName={friend.name}
            />
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

      {/* Google Contact Link Dialog */}
      {showLinkDialog && (
        <GoogleContactLinkDialog
          open={showLinkDialog}
          friendName={friend.name}
          contacts={unlinkableContacts}
          suggestedContacts={suggestedContacts}
          onLink={handleLink}
          onCancel={() => setShowLinkDialog(false)}
        />
      )}

      {/* Sync Diff Dialog */}
      {showDiffDialog && pendingDiffs && (
        <SyncDiffDialog
          open={showDiffDialog}
          friendName={friend.name}
          diffs={pendingDiffs}
          hasGoogleWrite={hasGoogleWrite}
          onApply={handleApplyDiffs}
          onCancel={() => {
            setShowDiffDialog(false)
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={isOpen => !isOpen && setShowDeleteConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {friend.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All data associated with {friend.name}{' '}
            will be permanently removed.
          </p>
          {isLinked && hasGoogleWrite && (
            <label className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteFromGoogle}
                onChange={e => setDeleteFromGoogle(e.target.checked)}
                className="mt-0.5 accent-destructive"
              />
              <div>
                <span className="text-sm font-medium text-destructive">
                  Also delete from Google Contacts
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This permanently deletes the contact from your Google account.
                </p>
              </div>
            </label>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </DialogClose>
            <Form
              method="post"
              action={`/friends/${friend.id}/delete`}
              onSubmit={() => setShowDeleteConfirm(false)}
            >
              {deleteFromGoogle && (
                <input type="hidden" name="deleteFromGoogle" value="true" />
              )}
              <Button type="submit" variant="destructive">
                <Trash2 size={14} className="mr-2" />
                Delete{deleteFromGoogle ? ' from both' : ''}
              </Button>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  return <ErrorDisplay error={error} />
}
