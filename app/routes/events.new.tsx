import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { Form, Link, redirect, useActionData } from 'react-router'
import { AddressAutocomplete } from '~/components/address-autocomplete'
import { BackLink } from '~/components/ui/back-link'
import { Button } from '~/components/ui/button'
import { FieldError } from '~/components/ui/field-error'
import { FormField } from '~/components/ui/form-field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select } from '~/components/ui/select'
import { SubmitButton } from '~/components/ui/submit-button'
import { APP_NAME } from '~/config'
import { getActivities } from '~/lib/activity.server'
import { isGoogleEnabled } from '~/lib/auth.server'
import { buildCalendarEventPayload } from '~/lib/calendar'
import {
  addInvitation,
  createEvent,
  getEventDetail,
  setGoogleCalendarEventId,
  updateEvent,
  updateInvitation,
} from '~/lib/event.server'
import { createGoogleCalendarEvent, hasGoogleScopes } from '~/lib/google.server'
import { isPlacesEnabled } from '~/lib/places.server'
import { EVENT_VIBE_LABELS, EVENT_VIBES, eventSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
import { cn } from '~/lib/utils'
import type { Route } from './+types/events.new'

export function meta() {
  return [{ title: `New Event — ${APP_NAME}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireSession(request)
  const activities = getActivities(session.user.id)

  const url = new URL(request.url)
  const activityId = url.searchParams.get('activityId') || undefined
  const friendId = url.searchParams.get('friendId') || undefined
  const friendName = url.searchParams.get('friendName') || undefined
  const returnTo = url.searchParams.get('returnTo') || undefined

  // Build a suggested event name when coming from a friend profile
  let defaultName = ''
  if (activityId && friendName) {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      defaultName = `${activity.name} with ${friendName}`
    }
  }

  const placesEnabled = isPlacesEnabled()
  const hasCalendarAccess =
    isGoogleEnabled &&
    hasGoogleScopes(session.user.id, [
      'https://www.googleapis.com/auth/calendar.events',
    ])

  return {
    activities,
    activityId,
    friendId,
    friendName,
    defaultName,
    placesEnabled,
    returnTo,
    hasCalendarAccess,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireSession(request)
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: eventSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const evt = createEvent(submission.value, session.user.id)

  // Auto-invite friend when creating from a friend profile
  const friendId = formData.get('friendId')
  if (typeof friendId === 'string' && friendId) {
    // Default the event to finalized and the friend to invited
    updateEvent(evt.id, { status: 'finalized' }, session.user.id)
    const invitation = addInvitation(evt.id, friendId)
    updateInvitation(invitation.id, { status: 'invited' })
  }

  // Add to Google Calendar if requested
  const addToCalendar = formData.get('addToCalendar') === 'on'
  if (addToCalendar) {
    const eventDetail = getEventDetail(evt.id, session.user.id)
    if (eventDetail?.date) {
      try {
        const timeZone = (formData.get('timeZone') as string) || undefined
        const payload = buildCalendarEventPayload({
          ...eventDetail,
          timeZone,
        })
        const result = await createGoogleCalendarEvent(session.user.id, payload)
        setGoogleCalendarEventId(
          evt.id,
          result.id,
          result.htmlLink,
          session.user.id,
        )
      } catch {
        // Calendar add failed silently — event was still created
      }
    }
  }

  // Redirect back to the originating page if specified, otherwise to the new event
  const returnTo = formData.get('returnTo')
  if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
    return redirect(returnTo)
  }
  return redirect(`/events/${evt.id}`)
}

export default function EventNew({ loaderData }: Route.ComponentProps) {
  const {
    activities,
    activityId,
    friendId,
    friendName,
    defaultName,
    placesEnabled,
    returnTo,
    hasCalendarAccess,
  } = loaderData
  const lastResult = useActionData<typeof action>()
  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      name: defaultName,
      activityId: activityId || '',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: eventSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  const [hasDate, setHasDate] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(false)

  const backTo = friendId ? `/friends/${friendId}` : '/events'
  const backLabel = friendName ? `Back to ${friendName}` : 'Back to Events'

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink to={backTo}>{backLabel}</BackLink>

      <h2 className="text-2xl font-bold mb-6">New Event</h2>

      <Form
        method="post"
        id={form.id}
        onSubmit={form.onSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-border-light bg-card p-6"
      >
        {friendId && <input type="hidden" name="friendId" value={friendId} />}
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        {/* Name */}
        <FormField>
          <Label htmlFor={fields.name.id}>
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={fields.name.id}
            name={fields.name.name}
            defaultValue={defaultName}
            placeholder="e.g., Poker Night"
            error={!!fields.name.errors}
          />
          <FieldError errors={fields.name.errors} />
        </FormField>

        {/* Activity */}
        <FormField>
          <Label htmlFor={fields.activityId.id}>Activity</Label>
          <Select
            id={fields.activityId.id}
            name={fields.activityId.name}
            defaultValue={activityId || ''}
          >
            <option value="">None</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField>
            <Label htmlFor={fields.date.id}>Date</Label>
            <Input
              id={fields.date.id}
              name={fields.date.name}
              type="date"
              onChange={e => {
                const filled = !!e.target.value
                setHasDate(filled)
                if (filled) setAddToCalendar(true)
                else setAddToCalendar(false)
              }}
            />
          </FormField>
          <FormField>
            <Label htmlFor={fields.time.id}>Time</Label>
            <Input id={fields.time.id} name={fields.time.name} type="time" />
          </FormField>
        </div>

        {/* Location */}
        <FormField>
          <Label htmlFor="location">Location</Label>
          <AddressAutocomplete
            namePrefix="location"
            placesEnabled={placesEnabled}
            placeholder="e.g., My place"
            error={!!fields.location.errors}
          />
          <FieldError errors={fields.location.errors} />
        </FormField>

        {/* Capacity and Vibe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField>
            <Label htmlFor={fields.capacity.id}>Capacity</Label>
            <Input
              id={fields.capacity.id}
              name={fields.capacity.name}
              type="number"
              min={1}
              max={1000}
              placeholder="e.g., 8"
              error={!!fields.capacity.errors}
            />
            <FieldError errors={fields.capacity.errors} />
          </FormField>
          <FormField>
            <Label htmlFor={fields.vibe.id}>Vibe</Label>
            <Select id={fields.vibe.id} name={fields.vibe.name}>
              <option value="">None</option>
              {EVENT_VIBES.map(v => (
                <option key={v} value={v}>
                  {EVENT_VIBE_LABELS[v]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Google Calendar */}
        {hasCalendarAccess && (
          <FormField>
            <label
              className={cn(
                'flex items-center gap-2 text-sm',
                hasDate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="checkbox"
                name="addToCalendar"
                checked={addToCalendar}
                onChange={e => setAddToCalendar(e.target.checked)}
                disabled={!hasDate}
                className="mt-0.5 accent-primary"
              />
              <CalendarPlus size={14} className="text-muted-foreground" />
              Add to Google Calendar
            </label>
            {!hasDate && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Set a date to enable this option
              </p>
            )}
            <input
              type="hidden"
              name="timeZone"
              value={Intl.DateTimeFormat().resolvedOptions().timeZone}
            />
          </FormField>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton pendingText="Creating...">Create Event</SubmitButton>
          <Button variant="outline" asChild>
            <Link to={backTo}>Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  )
}
