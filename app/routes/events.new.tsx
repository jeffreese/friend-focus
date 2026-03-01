import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
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
import { addInvitation, createEvent } from '~/lib/event.server'
import { isPlacesEnabled } from '~/lib/places.server'
import { EVENT_VIBE_LABELS, EVENT_VIBES, eventSchema } from '~/lib/schemas'
import { requireSession } from '~/lib/session.server'
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

  // Build a suggested event name when coming from a friend profile
  let defaultName = ''
  if (activityId && friendName) {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      defaultName = `${activity.name} with ${friendName}`
    }
  }

  const placesEnabled = isPlacesEnabled()

  return {
    activities,
    activityId,
    friendId,
    friendName,
    defaultName,
    placesEnabled,
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
    addInvitation(evt.id, friendId)
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
        <div className="grid grid-cols-2 gap-4">
          <FormField>
            <Label htmlFor={fields.date.id}>Date</Label>
            <Input id={fields.date.id} name={fields.date.name} type="date" />
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
        <div className="grid grid-cols-2 gap-4">
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
